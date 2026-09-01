import { analyzeText, computePriority, scoreToSeverity } from "./intelligence";
import type { Category, Report, Status } from "./types";
import { departmentFor } from "./types";

/**
 * PROTOTYPE DATASET — synthetic demo data for the CivicPulse hackathon build.
 * Locations are generic Indian urban locations around a fictional city grid.
 */

interface Seed {
  d: string;
  c: Category;
  landmark: string;
  ward: string;
  lat: number;
  lng: number;
  daysAgo: number;
  status: Status;
  reporter: string;
}

const IMAGES: Partial<Record<Category, string>> = {};

const raw: Seed[] = [
  // --- Main Gate pothole cluster (the demo hero cluster) ---
  ["Huge pothole near the main gate. Vehicles are struggling every morning.", "Pothole", "Main Gate Road", "Ward 12", 18.5211, 73.8562, 2, "Verified", "Ananya Rao"],
  ["Road damaged near college entrance, two-wheelers keep skidding.", "Road Damage", "Main Gate Road", "Ward 12", 18.5214, 73.8566, 3, "Submitted", "Rahul Menon"],
  ["Vehicles struggling near main gate because of a deep crater.", "Pothole", "Main Gate Road", "Ward 12", 18.5209, 73.8559, 4, "Submitted", "Anonymous"],
  ["Massive pothole opposite the bus stop near main gate, dangerous at night.", "Pothole", "Main Gate Road", "Ward 12", 18.5216, 73.8557, 5, "Verified", "Sneha Kulkarni"],
  ["Pothole has grown after the rain, an ambulance got stuck here.", "Pothole", "Main Gate Road", "Ward 12", 18.5207, 73.8571, 6, "Assigned", "Imran Shaikh"],
  ["Broken road surface near the main gate junction, urgent repair needed.", "Pothole", "Main Gate Road", "Ward 12", 18.5219, 73.8564, 8, "Submitted", "Anonymous"],
  ["Pothole near main gate crossing, school children walk here daily.", "Pothole", "Main Gate Road", "Ward 12", 18.5205, 73.8567, 9, "Submitted", "Priya Nair"],
  ["Craters all along main gate stretch, repeated complaints for months.", "Pothole", "Main Gate Road", "Ward 12", 18.5212, 73.8574, 12, "Verified", "Vikram Patil"],
  ["Sunken road patch near main gate, cars slow down and traffic backs up.", "Pothole", "Main Gate Road", "Ward 12", 18.5202, 73.8561, 15, "In Progress", "Meera Joshi"],

  // --- Sector 7 garbage cluster ---
  ["Garbage dump not cleared for a week near Sector 7 market, terrible smell.", "Garbage", "Sector 7 Market", "Ward 4", 18.5391, 73.8412, 1, "Submitted", "Farhan Ali"],
  ["Waste overflowing from the bin at Sector 7 market entrance.", "Garbage", "Sector 7 Market", "Ward 4", 18.5394, 73.8408, 3, "Verified", "Divya Shetty"],
  ["Trash piled on the footpath near Sector 7, stray dogs everywhere.", "Garbage", "Sector 7 Market", "Ward 4", 18.5388, 73.8416, 5, "Submitted", "Anonymous"],
  ["Rubbish dumped behind the vegetable market, stink is unbearable.", "Garbage", "Sector 7 Market", "Ward 4", 18.5396, 73.8419, 7, "Assigned", "Kavita Rane"],
  ["Litter scattered across the Sector 7 parking area every morning.", "Garbage", "Sector 7 Market", "Ward 4", 18.5385, 73.8404, 11, "Submitted", "Rohit Desai"],
  ["Garbage truck skipped our lane again this week.", "Garbage", "Sector 7 Market", "Ward 4", 18.539, 73.8422, 16, "Resolved", "Sana Qureshi"],

  // --- Lake Road waterlogging cluster ---
  ["Knee deep water logging near Lake Road after every rain.", "Waterlogging", "Lake Road", "Ward 9", 18.5122, 73.8701, 2, "Verified", "Arjun Bhatt"],
  ["Stagnant water in front of the hospital gate on Lake Road.", "Waterlogging", "Lake Road", "Ward 9", 18.5126, 73.8705, 4, "Assigned", "Neha Kapoor"],
  ["Rain water does not drain on Lake Road, shops are flooded.", "Waterlogging", "Lake Road", "Ward 9", 18.5118, 73.8697, 6, "Submitted", "Anonymous"],
  ["Flooded stretch near Lake Road bus stop, buses avoid the route.", "Waterlogging", "Lake Road", "Ward 9", 18.5129, 73.8694, 10, "Submitted", "Sanjay Iyer"],
  ["Water logging returns every monsoon here, repeated issue.", "Waterlogging", "Lake Road", "Ward 9", 18.5115, 73.8709, 18, "In Progress", "Ritu Sharma"],

  // --- Gandhi Chowk drainage cluster ---
  ["Clogged drain overflowing onto the road at Gandhi Chowk.", "Drainage", "Gandhi Chowk", "Ward 3", 18.5501, 73.8203, 3, "Submitted", "Deepak Kale"],
  ["Open manhole near Gandhi Chowk crossing, very dangerous.", "Drainage", "Gandhi Chowk", "Ward 3", 18.5505, 73.8207, 5, "Verified", "Anonymous"],
  ["Sewage overflow near Gandhi Chowk junction, health hazard.", "Drainage", "Gandhi Chowk", "Ward 3", 18.5498, 73.8199, 9, "Assigned", "Lata Pawar"],
  ["Gutter blocked with plastic waste near the chowk market.", "Drainage", "Gandhi Chowk", "Ward 3", 18.5509, 73.8211, 14, "Submitted", "Nikhil Verma"],

  // --- Green Park streetlight cluster ---
  ["Streetlight not working near Green Park, whole lane is dark.", "Streetlight", "Green Park", "Ward 7", 18.5288, 73.8855, 2, "Submitted", "Aisha Khan"],
  ["Three street lights off near the park gate, unsafe for women at night.", "Streetlight", "Green Park", "Ward 7", 18.5292, 73.8859, 6, "Verified", "Manish Gupta"],
  ["Lamp pole flickering near Green Park school entrance.", "Streetlight", "Green Park", "Ward 7", 18.5284, 73.885, 8, "Submitted", "Anonymous"],
  ["Dark stretch near Green Park after 8pm, lighting needed urgently.", "Streetlight", "Green Park", "Ward 7", 18.5295, 73.8848, 13, "Assigned", "Pooja Reddy"],

  // --- Station Road road damage cluster ---
  ["Cracked road near the railway station approach, tar has come off.", "Road Damage", "Station Road", "Ward 15", 18.5602, 73.9011, 4, "Submitted", "Harish Rao"],
  ["Damaged road near station flyover, unusable for two-wheelers.", "Road Damage", "Station Road", "Ward 15", 18.5606, 73.9015, 7, "Verified", "Anonymous"],
  ["Broken road patch outside station parking, accident risk.", "Road Damage", "Station Road", "Ward 15", 18.5598, 73.9007, 12, "In Progress", "Tanvi Bose"],

  // --- Scattered singles ---
  ["Pothole near Shivaji Nagar circle, small but growing.", "Pothole", "Shivaji Nagar", "Ward 2", 18.5701, 73.8402, 6, "Submitted", "Karan Malhotra"],
  ["Garbage bin missing at Rose Colony corner.", "Garbage", "Rose Colony", "Ward 6", 18.5011, 73.8302, 9, "Submitted", "Anonymous"],
  ["Streetlight pole leaning dangerously at Nehru Marg.", "Streetlight", "Nehru Marg", "Ward 11", 18.5455, 73.9102, 11, "Verified", "Suresh Naik"],
  ["Drain cover broken near Model Town park.", "Drainage", "Model Town", "Ward 8", 18.5155, 73.8201, 13, "Resolved", "Ayesha Sheikh"],
  ["Waterlogging near Anand Vihar underpass during heavy rain.", "Waterlogging", "Anand Vihar", "Ward 14", 18.5802, 73.8702, 15, "Resolved", "Gaurav Singh"],
  ["Stray construction debris blocking footpath at Tilak Road.", "Other", "Tilak Road", "Ward 5", 18.5061, 73.8551, 17, "Submitted", "Anonymous"],
  ["Road damage near Ambedkar Chowk after pipeline work.", "Road Damage", "Ambedkar Chowk", "Ward 10", 18.5352, 73.9002, 19, "Assigned", "Rekha Menon"],
  ["Garbage burning near Sunrise Apartments, heavy smoke daily.", "Garbage", "Sunrise Apartments", "Ward 13", 18.5252, 73.8102, 20, "Verified", "Amit Chandra"],
  ["Pothole cluster near Vidya School gate, children at risk.", "Pothole", "Vidya School", "Ward 1", 18.5901, 73.8802, 8, "Submitted", "Nandini Iyer"],
  ["Deep pothole beside Vidya School bus stop, repeated for weeks.", "Pothole", "Vidya School", "Ward 1", 18.5904, 73.8806, 14, "Submitted", "Anonymous"],
  ["Streetlight out near Vidya School crossing, very dark in the evening.", "Streetlight", "Vidya School", "Ward 1", 18.5898, 73.8798, 16, "Submitted", "Yash Agarwal"],
  ["Waterlogging near Vidya School gate, students wade through water.", "Waterlogging", "Vidya School", "Ward 1", 18.5907, 73.881, 5, "Verified", "Ishita Roy"],
  ["Overflowing drain near Vidya School boundary wall.", "Drainage", "Vidya School", "Ward 1", 18.5895, 73.8813, 10, "Submitted", "Anonymous"],
  ["Garbage heap outside Vidya School since last week.", "Garbage", "Vidya School", "Ward 1", 18.5909, 73.8795, 3, "Submitted", "Mohit Jain"],
].map(
  ([d, c, landmark, ward, lat, lng, daysAgo, status, reporter]) =>
    ({ d, c, landmark, ward, lat, lng, daysAgo, status, reporter }) as Seed,
);

function historyFor(status: Status, createdAt: string, id: string) {
  const flow: Status[] = ["Submitted", "Verified", "Assigned", "In Progress", "Resolved"];
  const upto = flow.slice(0, flow.indexOf(status) + 1);
  const base = new Date(createdAt).getTime();
  return upto.map((s, i) => ({
    id: `${id}-h${i}`,
    from: i === 0 ? null : upto[i - 1],
    to: s,
    changedBy: i === 0 ? "Citizen" : "Authority · Ward Office",
    at: new Date(base + i * 26 * 3600 * 1000).toISOString(),
    note: i === 0 ? "Report submitted by citizen." : undefined,
  }));
}

export function buildSeedReports(): Report[] {
  return raw.map((s, i) => {
    const analysis = analyzeText(s.d);
    const severityScore = Math.max(analysis.severityScore, s.c === "Other" ? 30 : 40);
    const recurrence = raw.filter((o) => o.landmark === s.landmark && o.c === s.c).length;
    const locationSensitive = /school|hospital|gate|junction|market|station|chowk|circle/i.test(
      s.landmark,
    );
    const priority = computePriority({
      severityScore,
      relatedReports: recurrence,
      recurrence,
      impact: analysis.impact,
      locationSensitive,
    });
    const createdAt = new Date(Date.now() - s.daysAgo * 86400000).toISOString();
    const id = `CP-${String(1001 + i)}`;
    return {
      id,
      description: s.d,
      category: s.c,
      imageUrl: IMAGES[s.c],
      landmark: s.landmark,
      ward: s.ward,
      lat: s.lat,
      lng: s.lng,
      severity: scoreToSeverity(severityScore),
      severityScore,
      priorityScore: priority.total,
      impact: analysis.impact,
      recurrence,
      status: s.status,
      department: departmentFor(s.c),
      reporter: s.reporter,
      anonymous: s.reporter === "Anonymous",
      createdAt,
      history: historyFor(s.status, createdAt, id),
      notes: [],
    } satisfies Report;
  });
}

export const WARDS = Array.from(new Set(raw.map((r) => r.ward)));
