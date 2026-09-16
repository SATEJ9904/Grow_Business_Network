/**
 * Sequential Moderation Case Number Generator
 * Produces GBN/CASE/{year}/{seq:06d}, e.g. GBN/CASE/2026/000123.
 * Uses an atomic $inc on a Counter document so concurrent report/block
 * submissions can never collide on the same number.
 */

const Counter = require("../models/Counter");

const getNextCaseNumber = async () => {
  const year = new Date().getFullYear();
  const counterId = `case_${year}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  );

  const seq = String(counter.seq).padStart(6, "0");
  return `GBN/CASE/${year}/${seq}`;
};

module.exports = { getNextCaseNumber };
