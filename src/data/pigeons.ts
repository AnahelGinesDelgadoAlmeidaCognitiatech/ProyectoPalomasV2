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
  // Great-grandparents
  { id: "p-001", ringNumber: "BE-2018-1234567", name: "Apollo", sex: "cock", color: "Blue Bar", bornYear: 2018, status: "breeder", loft: "Main Loft", breeder: "Van der Berg", image: pigeon1, wins: 8, races: 24 },
  { id: "p-002", ringNumber: "NL-2018-7654321", name: "Athena", sex: "hen", color: "Checker", bornYear: 2018, status: "breeder", loft: "Main Loft", breeder: "Van der Berg", image: pigeon2, wins: 5, races: 18 },
  { id: "p-003", ringNumber: "BE-2018-9988776", name: "Zeus", sex: "cock", color: "Blue Check", bornYear: 2018, status: "breeder", loft: "Breeding Loft", breeder: "Janssen", image: pigeon1, wins: 12, races: 30 },
  { id: "p-004", ringNumber: "ES-2018-1112223", name: "Hera", sex: "hen", color: "White", bornYear: 2018, status: "breeder", loft: "Breeding Loft", breeder: "Janssen", image: pigeon3, wins: 4, races: 16 },

  // Parents
  { id: "p-101", ringNumber: "BE-2020-4455667", name: "Hermes", sex: "cock", color: "Blue Bar", bornYear: 2020, status: "breeder", loft: "Main Loft", breeder: "Van der Berg", fatherId: "p-001", motherId: "p-002", image: pigeon1, wins: 9, races: 22 },
  { id: "p-102", ringNumber: "NL-2020-3344556", name: "Artemis", sex: "hen", color: "Checker", bornYear: 2020, status: "breeder", loft: "Main Loft", breeder: "Janssen", fatherId: "p-003", motherId: "p-004", image: pigeon2, wins: 7, races: 20 },

  // Champions
  { id: "p-201", ringNumber: "ES-2022-0099887", name: "Storm", sex: "cock", color: "Blue Check", bornYear: 2022, status: "racer", loft: "Race Loft", breeder: "Garcia", fatherId: "p-101", motherId: "p-102", image: pigeon1, wins: 14, races: 28, notes: "1st National Barcelona 2024" },
  { id: "p-202", ringNumber: "ES-2023-0011223", name: "Luna", sex: "hen", color: "White", bornYear: 2023, status: "racer", loft: "Race Loft", breeder: "Garcia", fatherId: "p-101", motherId: "p-102", image: pigeon3, wins: 6, races: 14 },
  { id: "p-203", ringNumber: "BE-2023-7788991", name: "Comet", sex: "cock", color: "Red Check", bornYear: 2023, status: "young", loft: "Young Birds", breeder: "Van der Berg", fatherId: "p-201", image: pigeon2, wins: 2, races: 6 },
  { id: "p-204", ringNumber: "NL-2024-5566778", name: "Nova", sex: "hen", color: "Blue Bar", bornYear: 2024, status: "young", loft: "Young Birds", breeder: "Janssen", fatherId: "p-201", motherId: "p-202", image: pigeon1, wins: 0, races: 2 },
  { id: "p-205", ringNumber: "ES-2022-2233445", name: "Phoenix", sex: "cock", color: "Slate", bornYear: 2022, status: "racer", loft: "Race Loft", breeder: "Garcia", image: pigeon2, wins: 11, races: 25 },
  { id: "p-206", ringNumber: "BE-2021-6677889", name: "Aurora", sex: "hen", color: "Checker", bornYear: 2021, status: "breeder", loft: "Breeding Loft", breeder: "Janssen", image: pigeon3, wins: 5, races: 17 },
];

export const getPigeon = (id?: string) => pigeons.find((p) => p.id === id);

export const getLofts = () => Array.from(new Set(pigeons.map((p) => p.loft)));
