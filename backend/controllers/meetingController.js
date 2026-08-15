/**
 * Meeting Controller
 * Admin: schedule chapter meetings and view booked seats.
 * Member: browse meetings for their own chapter, get notified of new ones,
 * and pay the seat fee via Razorpay.
 */

const Meeting = require("../models/Meeting");
const MeetingBooking = require("../models/MeetingBooking");
const Chapter = require("../models/Chapter");
const User = require("../models/User");
const { getRazorpayInstance } = require("../utils/razorpayClient");
const { verifyPaymentSignature } = require("../utils/razorpaySignature");
const { getMeetingFeeBreakdown } = require("../config/meetingFees");
const { getIO } = require("../utils/socket");
const { sendMeetingBookingConfirmationEmail } = require("../services/emailService");

/**
 * ============================================
 * ADMIN
 * ============================================
 */

/**
 * Create a meeting and notify every member of the selected chapter in
 * real time via Socket.IO.
 * POST /api/meetings
 */
const createMeeting = async (req, res) => {
  try {
    const { name, description, meetingDate, meetingTime, venue, chapterId, fee, gstPercent } = req.body;

    if (!name || !meetingDate || !meetingTime || !venue || !chapterId || fee === undefined || fee === "") {
      return res.status(400).json({
        success: false,
        message: "name, meetingDate, meetingTime, venue, chapterId and fee are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Meeting flyer image is required",
      });
    }

    const numericFee = Number(fee);
    if (Number.isNaN(numericFee) || numericFee < 0) {
      return res.status(400).json({
        success: false,
        message: "Meeting fee must be a valid non-negative number",
      });
    }

    const numericGstPercent = gstPercent === undefined || gstPercent === "" ? 0 : Number(gstPercent);
    if (Number.isNaN(numericGstPercent) || numericGstPercent < 0 || numericGstPercent > 100) {
      return res.status(400).json({
        success: false,
        message: "GST % must be a valid number between 0 and 100",
      });
    }

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: "Chapter not found",
      });
    }

    const meeting = await Meeting.create({
      name,
      description: description || "",
      flyerImage: req.file.path.replace(/\\/g, "/"),
      meetingDate,
      meetingTime,
      venue,
      chapterId: chapter._id,
      chapterName: chapter.name,
      city: chapter.city,
      fee: numericFee,
      gstPercent: numericGstPercent,
      createdBy: req.user._id,
    });

    try {
      getIO().to(`chapter:${chapter._id}`).emit("meeting:new", meeting);
    } catch (socketError) {
      console.error("Socket emit failed (meeting:new):", socketError.message);
    }

    return res.status(201).json({
      success: true,
      message: "Meeting created successfully",
      data: meeting,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to create meeting",
    });
  }
};

/**
 * List all meetings with a live booking count + subtotal per meeting.
 * GET /api/meetings/admin/all
 */
const listMeetingsAdmin = async (req, res) => {
  try {
    const meetings = await Meeting.find({ isActive: true }).sort({ meetingDateTime: -1 });

    const totals = await MeetingBooking.aggregate([
      { $match: { status: "paid" } },
      {
        $group: {
          _id: "$meetingId",
          bookingCount: { $sum: 1 },
          subtotal: { $sum: "$meetingFee" },
        },
      },
    ]);
    const totalsByMeeting = new Map(totals.map((t) => [String(t._id), t]));

    const data = meetings.map((meeting) => {
      const totalsForMeeting = totalsByMeeting.get(String(meeting._id));
      return {
        ...meeting.toObject(),
        bookingCount: totalsForMeeting?.bookingCount || 0,
        subtotal: totalsForMeeting?.subtotal || 0,
      };
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to fetch meetings",
    });
  }
};

/**
 * Booked-seats detail for the admin modal: who paid, from where, how much.
 * GET /api/meetings/:id/bookings
 */
const getMeetingBookings = async (req, res) => {
  try {
    const bookings = await MeetingBooking.find({ meetingId: req.params.id, status: "paid" })
      .populate({
        path: "userId",
        select: "name city chapterId",
        populate: { path: "chapterId", select: "name" },
      })
      .sort({ paidAt: -1 });

    const rows = bookings.map((booking) => ({
      bookingId: booking._id,
      memberName: booking.userId?.name || "Unknown",
      city: booking.userId?.city || "",
      chapterName: booking.userId?.chapterId?.name || "",
      transactionId: booking.razorpayPaymentId,
      amountPaid: booking.meetingFee,
      paidAt: booking.paidAt,
    }));

    const subtotal = rows.reduce((sum, row) => sum + row.amountPaid, 0);

    return res.status(200).json({
      success: true,
      data: { bookings: rows, subtotal },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to fetch bookings",
    });
  }
};

/**
 * ============================================
 * MEMBER
 * ============================================
 */

const annotateMeeting = (meeting, bookedMeetingIds, seenMeetingIds) => {
  const now = Date.now();
  return {
    ...meeting.toObject(),
    isBooked: bookedMeetingIds.has(String(meeting._id)),
    isSeen: seenMeetingIds.has(String(meeting._id)),
    isPast: new Date(meeting.meetingDateTime).getTime() < now,
  };
};

/**
 * All meetings for the logged-in member's own chapter.
 * GET /api/meetings
 */
const listMeetingsForMember = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("chapterId");
    if (!user?.chapterId) {
      return res.status(200).json({ success: true, data: [] });
    }

    const meetings = await Meeting.find({ chapterId: user.chapterId, isActive: true }).sort({
      meetingDateTime: -1,
    });

    const bookedRows = await MeetingBooking.find({ userId: req.userId, status: "paid" }).select("meetingId");
    const bookedMeetingIds = new Set(bookedRows.map((b) => String(b.meetingId)));

    const seenMeetingIds = new Set(
      meetings
        .filter((m) => m.seenBy.some((s) => String(s.user) === String(req.userId)))
        .map((m) => String(m._id))
    );

    const data = meetings.map((m) => annotateMeeting(m, bookedMeetingIds, seenMeetingIds));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to fetch meetings",
    });
  }
};

/**
 * Unseen, still-upcoming meetings for the logged-in member's chapter — used
 * to trigger the on-open popup for members who were inactive when the
 * meeting was created.
 * GET /api/meetings/unseen
 */
const listUnseenMeetings = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("chapterId");
    if (!user?.chapterId) {
      return res.status(200).json({ success: true, data: [] });
    }

    const meetings = await Meeting.find({
      chapterId: user.chapterId,
      isActive: true,
      meetingDateTime: { $gt: new Date() },
      "seenBy.user": { $ne: req.userId },
    }).sort({ meetingDateTime: 1 });

    const bookedRows = await MeetingBooking.find({ userId: req.userId, status: "paid" }).select("meetingId");
    const bookedMeetingIds = new Set(bookedRows.map((b) => String(b.meetingId)));

    const data = meetings.map((m) => ({
      ...m.toObject(),
      isBooked: bookedMeetingIds.has(String(m._id)),
      isSeen: false,
      isPast: false,
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to fetch unseen meetings",
    });
  }
};

/**
 * Mark a meeting as seen by the logged-in member (idempotent). This is what
 * suppresses the popup on future app opens — it only ever lives in the
 * Notifications list after this.
 * POST /api/meetings/:id/mark-seen
 */
const markMeetingSeen = async (req, res) => {
  try {
    await Meeting.updateOne(
      { _id: req.params.id, "seenBy.user": { $ne: req.userId } },
      { $push: { seenBy: { user: req.userId, seenAt: new Date() } } }
    );

    return res.status(200).json({ success: true, message: "Meeting marked as seen" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to mark meeting as seen",
    });
  }
};

/**
 * Create a Razorpay order for a meeting seat. Amount is computed entirely
 * server-side (getMeetingFeeBreakdown) from the admin-set fee.
 * POST /api/meetings/:id/create-order
 */
const createBookingOrder = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting || !meeting.isActive) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }

    if (new Date(meeting.meetingDateTime).getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: "This meeting has already taken place" });
    }

    const existingBooking = await MeetingBooking.findOne({
      meetingId: meeting._id,
      userId: req.userId,
      status: "paid",
    });
    if (existingBooking) {
      return res.status(400).json({ success: false, message: "You have already booked a seat for this meeting" });
    }

    const user = await User.findById(req.userId).select("name email mobile");
    const feeBreakdown = getMeetingFeeBreakdown(meeting.fee, meeting.gstPercent);

    const order = await getRazorpayInstance().orders.create({
      amount: feeBreakdown.totalPaise,
      currency: feeBreakdown.currency,
      receipt: `meeting_${meeting._id}_${Date.now()}`,
      notes: {
        "Meeting": meeting.name,
        "Member Name": user?.name || "",
        Email: user?.email || "",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        feeBreakdown,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.error?.description || error.message || "Unable to create payment order",
    });
  }
};

/**
 * Verify a captured seat payment, persist the booking, email the receipt,
 * and push a live update to the admin dashboard.
 * POST /api/meetings/:id/verify-payment
 */
const verifyBookingPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      return res.status(400).json({ success: false, message: "Payment verification failed." });
    }

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }

    const feeBreakdown = getMeetingFeeBreakdown(meeting.fee, meeting.gstPercent);

    const booking = await MeetingBooking.findOneAndUpdate(
      { meetingId: meeting._id, userId: req.userId },
      {
        $set: {
          meetingId: meeting._id,
          userId: req.userId,
          meetingFee: feeBreakdown.baseAmount,
          gstPercent: feeBreakdown.gstPercent,
          gstAmount: feeBreakdown.gstAmount,
          commission: feeBreakdown.commission,
          commissionGst: feeBreakdown.commissionGst,
          totalAmount: feeBreakdown.totalAmount,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          status: "paid",
          paidAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    const user = await User.findById(req.userId).select("name email city chapterId").populate("chapterId", "name");

    if (user?.email) {
      sendMeetingBookingConfirmationEmail(user.email, user.name, meeting, booking).catch((emailError) => {
        console.error("Failed to send meeting booking email:", emailError.message);
      });
    }

    try {
      const totals = await MeetingBooking.aggregate([
        { $match: { meetingId: meeting._id, status: "paid" } },
        { $group: { _id: "$meetingId", bookingCount: { $sum: 1 }, subtotal: { $sum: "$meetingFee" } } },
      ]);

      getIO()
        .to("admin")
        .emit("meeting:booking", {
          meetingId: String(meeting._id),
          bookingCount: totals[0]?.bookingCount || 0,
          subtotal: totals[0]?.subtotal || 0,
          booking: {
            bookingId: booking._id,
            memberName: user?.name || "Unknown",
            city: user?.city || "",
            chapterName: user?.chapterId?.name || "",
            transactionId: booking.razorpayPaymentId,
            amountPaid: booking.meetingFee,
            paidAt: booking.paidAt,
          },
        });
    } catch (socketError) {
      console.error("Socket emit failed (meeting:booking):", socketError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified and seat booked",
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.error?.description || error.message || "Unable to verify payment",
    });
  }
};

module.exports = {
  createMeeting,
  listMeetingsAdmin,
  getMeetingBookings,
  listMeetingsForMember,
  listUnseenMeetings,
  markMeetingSeen,
  createBookingOrder,
  verifyBookingPayment,
};
