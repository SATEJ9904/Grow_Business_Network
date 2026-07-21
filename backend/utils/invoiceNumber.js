/**
 * Sequential Invoice Number Generator
 * Produces GBN/INV/{year}/{seq:06d}, e.g. GBN/INV/2026/000123.
 * Uses an atomic $inc on a Counter document so concurrent registrations
 * can never collide on the same number.
 */

const Counter = require("../models/Counter");

const getNextInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const counterId = `invoice_${year}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  );

  const seq = String(counter.seq).padStart(6, "0");
  return `GBN/INV/${year}/${seq}`;
};

module.exports = { getNextInvoiceNumber };
