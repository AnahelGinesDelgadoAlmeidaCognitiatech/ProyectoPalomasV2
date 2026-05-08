import pigeon1 from "@/assets/pigeon-1.jpg";
import pigeon2 from "@/assets/pigeon-2.jpg";
import pigeon3 from "@/assets/pigeon-3.jpg";

export type Sex = "cock" | "hen";
export type Status = "breeder" | "racer" | "young" | "lost";

export interface Pigeon {
  id: string;
  ringNumber: string;
  name: string;
  sex: Sex;
  color: string;
  bornYear: number;
  status: Status;
  loft: string;
  breeder: string;
  fatherId?: string;
  motherId?: string;
  image: string;
  notes?: string;
  wins?: number;
  races?: number;
}

export const pigeons: Pigeon[] = [
  // --- GENERATION 5 (Great-Great-Great-Grandparents) ---
  { id: "g5-01", ringNumber: "BE-2014-0000001", name: "Old Foundation", sex: "cock", color: "Blue Bar", bornYear: 2014, status: "breeder", loft: "Breeding Loft", breeder: "Heritage Lofts", image: pigeon1 },
  { id: "g5-02", ringNumber: "BE-2014-0000002", name: "Golden Hen", sex: "hen", color: "Blue Bar", bornYear: 2014, status: "breeder", loft: "Breeding Loft", breeder: "Heritage Lofts", image: pigeon2 },
  { id: "g5-03", ringNumber: "NL-2014-0000003", name: "Speedy Cock", sex: "cock", color: "Checker", bornYear: 2014, status: "breeder", loft: "Breeding Loft", breeder: "Dutch Masters", image: pigeon1 },
  { id: "g5-04", ringNumber: "NL-2014-0000004", name: "Fast Hen", sex: "hen", color: "Checker", bornYear: 2014, status: "breeder", loft: "Breeding Loft", breeder: "Dutch Masters", image: pigeon2 },
  { id: "g5-05", ringNumber: "BE-2014-0000005", name: "Iron Sire", sex: "cock", color: "Blue Check", bornYear: 2014, status: "breeder", loft: "Breeding Loft", breeder: "Heritage Lofts", image: pigeon1 },
  { id: "g5-06", ringNumber: "BE-2014-0000006", name: "Silk Dam", sex: "hen", color: "Blue Check", bornYear: 2014, status: "breeder", loft: "Breeding Loft", breeder: "Heritage Lofts", image: pigeon2 },
  { id: "g5-07", ringNumber: "ES-2014-0000007", name: "Spanish King", sex: "cock", color: "White", bornYear: 2014, status: "breeder", loft: "Breeding Loft", breeder: "Royal Lofts", image: pigeon1 },
  { id: "g5-08", ringNumber: "ES-2014-0000008", name: "Spanish Queen", sex: "hen", color: "White", bornYear: 2014, status: "breeder", loft: "Breeding Loft", breeder: "Royal Lofts", image: pigeon2 },
  { id: "g5-09", ringNumber: "BE-2014-0000009", name: "Grizzle King", sex: "cock", color: "Grizzle", bornYear: 2014, status: "breeder", loft: "Breeding Loft", breeder: "Heritage Lofts", image: pigeon3 },
  { id: "g5-10", ringNumber: "BE-2014-0000010", name: "Grizzle Queen", sex: "hen", color: "Grizzle", bornYear: 2014, status: "breeder", loft: "Breeding Loft", breeder: "Heritage Lofts", image: pigeon3 },
  { id: "g5-11", ringNumber: "NL-2014-0000011", name: "Thunder", sex: "cock", color: "Red Check", bornYear: 2014, status: "breeder", loft: "Breeding Loft", breeder: "Dutch Masters", image: pigeon1 },
  { id: "g5-12", ringNumber: "NL-2014-0000012", name: "Lightning", sex: "hen", color: "Red Check", bornYear: 2014, status: "breeder", loft: "Breeding Loft", breeder: "Dutch Masters", image: pigeon2 },
  { id: "g5-13", ringNumber: "BE-2014-0000013", name: "The Rock", sex: "cock", color: "Slate", bornYear: 2014, status: "breeder", loft: "Breeding Loft", breeder: "Heritage Lofts", image: pigeon1 },
  { id: "g5-14", ringNumber: "BE-2014-0000014", name: "The Pearl", sex: "hen", color: "Slate", bornYear: 2014, status: "breeder", loft: "Breeding Loft", breeder: "Heritage Lofts", image: pigeon2 },
  { id: "g5-15", ringNumber: "ES-2014-0000015", name: "Eagle", sex: "cock", color: "Pied", bornYear: 2014, status: "breeder", loft: "Breeding Loft", breeder: "Royal Lofts", image: pigeon1 },
  { id: "g5-16", ringNumber: "ES-2014-0000016", name: "Falcon", sex: "hen", color: "Pied", bornYear: 2014, status: "breeder", loft: "Breeding Loft", breeder: "Royal Lofts", image: pigeon2 },

  // --- GENERATION 4 (Great-Great-Grandparents) ---
  { id: "g4-01", ringNumber: "BE-2016-0000101", name: "Foundation Son", sex: "cock", color: "Blue Bar", bornYear: 2016, status: "breeder", loft: "Breeding Loft", breeder: "Heritage Lofts", fatherId: "g5-01", motherId: "g5-02", image: pigeon1 },
  { id: "g4-02", ringNumber: "BE-2016-0000102", name: "Speedy Daughter", sex: "hen", color: "Checker", bornYear: 2016, status: "breeder", loft: "Breeding Loft", breeder: "Dutch Masters", fatherId: "g5-03", motherId: "g5-04", image: pigeon2 },
  { id: "g4-03", ringNumber: "BE-2016-0000103", name: "Iron Silk", sex: "cock", color: "Blue Check", bornYear: 2016, status: "breeder", loft: "Breeding Loft", breeder: "Heritage Lofts", fatherId: "g5-05", motherId: "g5-06", image: pigeon1 },
  { id: "g4-04", ringNumber: "ES-2016-0000104", name: "Spanish Star", sex: "hen", color: "White", bornYear: 2016, status: "breeder", loft: "Breeding Loft", breeder: "Royal Lofts", fatherId: "g5-07", motherId: "g5-08", image: pigeon3 },
  { id: "g4-05", ringNumber: "BE-2016-0000105", name: "Grizzle Prince", sex: "cock", color: "Grizzle", bornYear: 2016, status: "breeder", loft: "Breeding Loft", breeder: "Heritage Lofts", fatherId: "g5-09", motherId: "g5-10", image: pigeon3 },
  { id: "g4-06", ringNumber: "NL-2016-0000106", name: "Thunder Light", sex: "hen", color: "Red Check", bornYear: 2016, status: "breeder", loft: "Breeding Loft", breeder: "Dutch Masters", fatherId: "g5-11", motherId: "g5-12", image: pigeon2 },
  { id: "g4-07", ringNumber: "BE-2016-0000107", name: "Rock Pearl", sex: "cock", color: "Slate", bornYear: 2016, status: "breeder", loft: "Breeding Loft", breeder: "Heritage Lofts", fatherId: "g5-13", motherId: "g5-14", image: pigeon1 },
  { id: "g4-08", ringNumber: "ES-2016-0000108", name: "Eagle Falcon", sex: "hen", color: "Pied", bornYear: 2016, status: "breeder", loft: "Breeding Loft", breeder: "Royal Lofts", fatherId: "g5-15", motherId: "g5-16", image: pigeon2 },

  // --- GENERATION 3 (Great-Grandparents) ---
  { id: "g3-01", ringNumber: "BE-2018-0001001", name: "Apollo", sex: "cock", color: "Blue Bar", bornYear: 2018, status: "breeder", loft: "Main Loft", breeder: "Van der Berg", fatherId: "g4-01", motherId: "g4-02", image: pigeon1, wins: 8 },
  { id: "g3-02", ringNumber: "NL-2018-0001002", name: "Athena", sex: "hen", color: "Checker", bornYear: 2018, status: "breeder", loft: "Main Loft", breeder: "Van der Berg", fatherId: "g4-03", motherId: "g4-04", image: pigeon2, wins: 5 },
  { id: "g3-03", ringNumber: "BE-2018-0001003", name: "Zeus", sex: "cock", color: "Blue Check", bornYear: 2018, status: "breeder", loft: "Breeding Loft", breeder: "Janssen", fatherId: "g4-05", motherId: "g4-06", image: pigeon1, wins: 12 },
  { id: "g3-04", ringNumber: "ES-2018-0001004", name: "Hera", sex: "hen", color: "White", bornYear: 2018, status: "breeder", loft: "Breeding Loft", breeder: "Janssen", fatherId: "g4-07", motherId: "g4-08", image: pigeon3, wins: 4 },

  // --- GENERATION 2 (Grandparents) ---
  { id: "g2-01", ringNumber: "BE-2020-0010001", name: "Hermes", sex: "cock", color: "Blue Bar", bornYear: 2020, status: "breeder", loft: "Main Loft", breeder: "Van der Berg", fatherId: "g3-01", motherId: "g3-02", image: pigeon1, wins: 9 },
  { id: "g2-02", ringNumber: "NL-2020-0010002", name: "Artemis", sex: "hen", color: "Checker", bornYear: 2020, status: "breeder", loft: "Main Loft", breeder: "Janssen", fatherId: "g3-03", motherId: "g3-04", image: pigeon2, wins: 7 },

  // --- GENERATION 1 (Parents) ---
  { id: "g1-01", ringNumber: "ES-2022-0100001", name: "Storm", sex: "cock", color: "Blue Check", bornYear: 2022, status: "racer", loft: "Race Loft", breeder: "Garcia", fatherId: "g2-01", motherId: "g2-02", image: pigeon1, wins: 14, notes: "Legendary racer" },
  { id: "g1-02", ringNumber: "ES-2022-0100002", name: "Luna", sex: "hen", color: "White", bornYear: 2022, status: "racer", loft: "Race Loft", breeder: "Garcia", fatherId: "g2-01", motherId: "g2-02", image: pigeon3, wins: 11, notes: "Full sibling to Storm" },

  // --- TARGET (The Super Champion) ---
  { id: "target-01", ringNumber: "ES-2024-Legend", name: "Legend", sex: "cock", color: "Blue Bar", bornYear: 2024, status: "young", loft: "Race Loft", breeder: "Garcia", fatherId: "g1-01", motherId: "g1-02", image: pigeon1, wins: 2, notes: "Result of sibling mating (High COI test)" },

  // --- EXTRA BIRDS (For variety) ---
  { id: "extra-01", ringNumber: "BE-2022-9990001", name: "Phoenix", sex: "cock", color: "Slate", bornYear: 2022, status: "racer", loft: "Race Loft", breeder: "Garcia", image: pigeon2, wins: 11 },
  { id: "extra-02", ringNumber: "BE-2021-9990002", name: "Aurora", sex: "hen", color: "Checker", bornYear: 2021, status: "breeder", loft: "Breeding Loft", breeder: "Janssen", image: pigeon3, wins: 5 },
  { id: "extra-03", ringNumber: "NL-2024-9990003", name: "Nova", sex: "hen", color: "Blue Bar", bornYear: 2024, status: "young", loft: "Young Birds", breeder: "Janssen", fatherId: "g1-01", motherId: "extra-02", image: pigeon1 },
];

export const getPigeon = (id?: string) => pigeons.find((p) => p.id === id);

export const getLofts = () => Array.from(new Set(pigeons.map((p) => p.loft)));

