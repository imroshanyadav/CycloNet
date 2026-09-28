/**
 * NASA GIBS Satellite Swath & Real-Time IST Timestamp Helpers
 */

export function getLiveGibsDate(): string {
  const d = new Date();
  // Satellite passes over the Indian subcontinent occur around 10:30 AM local (approx 05:00 UTC) for Terra
  // and 01:30 PM local (approx 08:00 UTC) for Aqua/SNPP.
  // NASA GIBS tiles are generated within 1-2 hours of pass.
  // If UTC hour < 4, use yesterday to guarantee 100% complete swath coverage
  if (d.getUTCHours() < 4) {
    const yesterday = new Date(d.getTime() - 24 * 60 * 60 * 1000);
    return yesterday.toISOString().split("T")[0];
  }
  return d.toISOString().split("T")[0];
}

export function getFrameCaptureTimes() {
  const d = new Date();
  // Indian Standard Time (IST) is UTC + 5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(d.getTime() + istOffset);

  const hours = istDate.getUTCHours();
  const ampm = hours >= 12 ? "pm" : "am";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const hourStr = String(hour12).padStart(2, "0");

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sept", "Oct", "Nov", "Dec",
  ];
  const day = istDate.getUTCDate();
  const month = months[istDate.getUTCMonth()];
  const year = istDate.getUTCFullYear();

  const capturedStr = `${day} ${month} ${year}, ${hourStr}:00 ${ampm} IST`;

  const nextHour = (hours + 1) % 24;
  const nextAmpm = nextHour >= 12 ? "pm" : "am";
  const nextHour12 = nextHour % 12 === 0 ? 12 : nextHour % 12;
  const nextHourStr = String(nextHour12).padStart(2, "0");
  const nextStr = `${day} ${month} ${year}, ${nextHourStr}:00 ${nextAmpm} IST`;

  return {
    captured: capturedStr,
    next: nextStr,
    updatedTime: `${hourStr}:00 ${ampm}`,
    rawDate: `${day} ${month} ${year}`,
  };
}
