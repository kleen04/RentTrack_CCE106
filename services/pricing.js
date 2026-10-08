export const DISTANCE_RATE_PER_KM = 20;

export function calculateRentalQuote(
  dailyRate,
  rentalDays,
  destinationKm,
  distanceRatePerKm = DISTANCE_RATE_PER_KM
) {
  const rate = Number(dailyRate);
  const days = Number(rentalDays);
  const distance = Number(destinationKm);
  const distanceRate = Number(distanceRatePerKm);
  if (
    ![rate, days, distance, distanceRate].every(Number.isFinite) ||
    rate < 0 ||
    days < 0 ||
    distance < 0 ||
    distanceRate < 0
  ) {
    throw new Error("Rental pricing requires valid non-negative amounts and distances.");
  }

  const baseAmount = Math.round(rate * days);
  const distanceAmount = Math.round(distance * distanceRate);
  return {
    baseAmount,
    distanceAmount,
    totalAmount: baseAmount + distanceAmount,
  };
}
