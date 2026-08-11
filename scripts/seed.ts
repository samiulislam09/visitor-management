import "dotenv/config";
import { dbConnect } from "@/lib/mongodb";
import { Host } from "@/models/Host";
import { User } from "@/models/User";
import { Visitor } from "@/models/Visitor";
import { Counter } from "@/models/Counter";
import { hashPassword } from "@/lib/password";

const HOSTS = [
  { employeeId: "EMP-001", name: "Ahmed Rahman", department: "Engineering", designation: "Senior Engineer" },
  { employeeId: "EMP-002", name: "Fatima Begum", department: "Human Resources", designation: "HR Manager" },
  { employeeId: "EMP-003", name: "Tanvir Ahmed", department: "Sales", designation: "Sales Lead" },
  { employeeId: "EMP-004", name: "Nusrat Jahan", department: "Marketing", designation: "Marketing Executive" },
  { employeeId: "EMP-005", name: "Rafiqul Islam", department: "Finance", designation: "Accountant" },
  { employeeId: "EMP-006", name: "Sharmin Sultana", department: "Operations", designation: "Operations Manager" },
  { employeeId: "EMP-007", name: "Imran Hossain", department: "Engineering", designation: "DevOps Engineer" },
  { employeeId: "EMP-008", name: "Rehana Akter", department: "Legal", designation: "Legal Counsel" },
  { employeeId: "EMP-009", name: "Zahir Uddin", department: "IT Support", designation: "IT Technician" },
  { employeeId: "EMP-010", name: "Maya Chowdhury", department: "Product", designation: "Product Manager" },
];

const USERS = [
  { email: "admin@company.com", name: "System Administrator", password: "admin123", role: "ADMIN" },
  { email: "reception@company.com", name: "Reception Desk", password: "reception123", role: "RECEPTIONIST" },
  { email: "security@company.com", name: "Security Desk", password: "security123", role: "SECURITY" },
];

const PURPOSES = ["Meeting", "Interview", "Delivery", "Maintenance", "Personal Visit", "Official Work", "Other"];
const CUSTOM_PURPOSES = ["Vendor onboarding", "Server maintenance", "Contractor inspection", "Marketing photoshoot"];

const FIRST_NAMES = [
  "John", "Emily", "Michael", "Sarah", "David", "Laura", "James", "Emma",
  "Robert", "Olivia", "William", "Sophia", "Daniel", "Isabella", "Thomas", "Mia",
  "Charles", "Amelia", "Joseph", "Harper", "Samuel", "Ava", "Richard", "Abigail",
];
const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor",
  "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris",
];
const COMPANIES = [
  "Acme Corp", "Globex", "Initech", "Umbrella Ltd", "Stark Industries",
  "Wayne Enterprises", "Hooli", "Pied Piper", "Massive Dynamic", "Cyberdyne Systems",
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randPhone(): string {
  return `+8801${rand(300000000, 899999999)}`;
}

function atDayOffset(daysAgo: number, hour: number, minute: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function dateKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}${m}${day}`;
}

async function seedHosts() {
  let created = 0;
  for (const host of HOSTS) {
    const existing = await Host.findOne({ employeeId: host.employeeId });
    if (!existing) {
      await Host.create({
        ...host,
        email: `${host.name.toLowerCase().replace(/\s+/g, ".") ?? "host"}@company.com`,
        phone: randPhone(),
        status: "ACTIVE",
      });
      created++;
    }
  }
  return created;
}

async function seedUsers() {
  let created = 0;
  for (const user of USERS) {
    const existing = await User.findOne({ email: user.email });
    if (!existing) {
      await User.create({
        email: user.email,
        name: user.name,
        passwordHash: hashPassword(user.password),
        role: user.role as "ADMIN" | "RECEPTIONIST" | "SECURITY",
        isActive: true,
      });
      created++;
    }
  }
  return created;
}

async function seedVisitors() {
  const hostCount = await Host.countDocuments();
  if (hostCount === 0) {
    console.error("No hosts available to assign visitors. Seed hosts first.");
    process.exit(1);
  }
  const hosts = await Host.find({}).sort({ name: 1 }).lean();
  const seqByDate = new Map<string, number>();

  const existingCount = await Visitor.countDocuments();
  if (existingCount > 0) {
    console.log(`Skipping visitor seeding: ${existingCount} visitors already exist.`);
    return 0;
  }

  let created = 0;

  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const visitsPerDay = rand(2, 3);
    for (let v = 0; v < visitsPerDay; v++) {
      const host = pick(hosts);
      const purpose = pick(PURPOSES);
      const createdTime = atDayOffset(daysAgo, rand(8, 17), rand(0, 59));

      const key = dateKey(createdTime);
      const seq = (seqByDate.get(key) ?? 0) + 1;
      seqByDate.set(key, seq);
      const visitorId = `VIS-${key}-${String(seq).padStart(5, "0")}`;

      const roll = Math.random();
      let status: string;
      let checkInTime: Date | undefined;
      let checkOutTime: Date | undefined;
      let expectedDate: Date | undefined;

      if (daysAgo === 0) {
        const todayRoll = Math.random();
        if (todayRoll < 0.4) {
          status = "CHECKED_OUT";
          checkInTime = atDayOffset(0, rand(8, 12), rand(0, 59));
          checkOutTime = new Date(checkInTime.getTime() + rand(30, 180) * 60000);
        } else if (todayRoll < 0.75) {
          status = "CHECKED_IN";
          checkInTime = atDayOffset(0, rand(9, 16), rand(0, 59));
          checkOutTime = undefined;
        } else {
          status = "EXPECTED";
          expectedDate = atDayOffset(-rand(1, 3), rand(9, 17), rand(0, 59));
        }
      } else if (roll < 0.55) {
        status = "CHECKED_OUT";
        checkInTime = new Date(createdTime);
        checkOutTime = new Date(checkInTime.getTime() + rand(30, 240) * 60000);
      } else if (roll < 0.8) {
        status = "CANCELLED";
      } else {
        status = "EXPECTED";
        expectedDate = daysAgo === 0 ? atDayOffset(1, 10, 30) : atDayOffset(rand(0, 2), rand(9, 17), rand(0, 59));
      }

      const firstName = pick(FIRST_NAMES);
      const lastName = pick(LAST_NAMES);

      await Visitor.create({
        visitorId,
        fullName: `${firstName} ${lastName}`,
        phone: randPhone(),
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        company: Math.random() < 0.7 ? pick(COMPANIES) : undefined,
        purpose,
        customPurpose: purpose === "Other" ? pick(CUSTOM_PURPOSES) : undefined,
        hostId: host._id,
        department: host.department,
        expectedDate,
        expectedTime: expectedDate
          ? expectedDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
          : undefined,
        expectedDuration: rand(30, 120),
        numberOfVisitors: Math.random() < 0.3 ? rand(2, 5) : undefined,
        vehicleNumber: Math.random() < 0.2 ? `DM-${rand(100, 999)}-${rand(100, 999)}` : undefined,
        notes: Math.random() < 0.15 ? "Bringing packages from courier." : undefined,
        status: status as "EXPECTED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED",
        checkInTime,
        checkOutTime,
        createdAt: createdTime,
      });
      created++;
    }
  }

  return created;
}

async function main() {
  console.log("Connecting to MongoDB…");
  await dbConnect();

  const hosts = await seedHosts();
  console.log(`Hosts: ${hosts > 0 ? `created ${hosts} new` : "all present (skipped)"}`);

  const users = await seedUsers();
  console.log(`Users: ${users > 0 ? `created ${users} new` : "all present (skipped)"}`);
  if (users > 0) {
    console.log("Seeded login accounts:");
    console.log("  admin@company.com / admin123 (ADMIN)");
    console.log("  reception@company.com / reception123 (RECEPTIONIST)");
    console.log("  security@company.com / security123 (SECURITY)");
  }

  const visitors = await seedVisitors();
  console.log(`Visitors: ${visitors > 0 ? `created ${visitors}` : "skipped (non-empty collection)"}`);

  await Counter.deleteMany({ _id: { $regex: /^visitor-/ } });
  console.log("Reset visitor ID counters for a fresh sequence.");

  console.log("Seed complete. Run `npm run dev` and sign in with one of the accounts above.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});