import { 
  type Pigeon, type Pair, type Season, type Race, type Team, 
  type Contact, type Station, type Loft, type JournalEntry, 
  type Medication, type BandCollection, type AutocompleteValue 
} from "@/lib/db";
import pigeon1 from "@/assets/pigeon-1.jpg";
import pigeon2 from "@/assets/pigeon-2.jpg";
import pigeon3 from "@/assets/pigeon-3.jpg";

const now = Date.now();

export const mockSeasons: Season[] = [
  { id: "s-2024", year: "2024", name: "Temporada de Cría 2024", notes: "Foco en resistencia", createdAt: now, updatedAt: now },
  { id: "s-2025", year: "2025", name: "Temporada de Cría 2025", notes: "Foco en velocidad", createdAt: now, updatedAt: now },
];

export const mockLofts: Loft[] = [
  { id: "l-main", name: "Palomar Principal", lat: 28.1234, lng: -15.4321, capacity: 50, isPrimary: true, createdAt: now, updatedAt: now },
  { id: "l-breed", name: "Palomar Reproducción", lat: 28.1240, lng: -15.4330, capacity: 20, isPrimary: false, createdAt: now, updatedAt: now },
  { id: "l-race", name: "Palomar Competición", lat: 28.1250, lng: -15.4340, capacity: 30, isPrimary: false, createdAt: now, updatedAt: now },
];

export const mockContacts: Contact[] = [
  { id: "c-1", name: "Manuel García", country: "España", email: "m.garcia@email.com", phone: "+34 600 123 456", loft: "García Lofts", createdAt: now, updatedAt: now },
  { id: "c-2", name: "Luc Janssen", country: "Bélgica", email: "l.janssen@pigeon.be", phone: "+32 475 987 654", loft: "Janssen Brothers", createdAt: now, updatedAt: now },
  { id: "c-3", name: "Piet van der Berg", country: "Holanda", email: "piet@vdb-pigeons.nl", loft: "Van der Berg Syndicate", createdAt: now, updatedAt: now },
];

export const mockStations: Station[] = [
  { id: "st-bcn", name: "Barcelona International", country: "España", lat: 41.3851, lng: 2.1734, notes: "Punto de suelta clásico", createdAt: now, updatedAt: now },
  { id: "st-pau", name: "Pau National", country: "Francia", lat: 43.2951, lng: -0.3708, createdAt: now, updatedAt: now },
  { id: "st-bdx", name: "Bordeaux Regional", country: "Francia", lat: 44.8378, lng: -0.5792, createdAt: now, updatedAt: now },
];

export const mockTeams: Team[] = [
  { id: "t-speed", name: "Equipo Velocidad 2025", pigeonIds: ["g1-01", "extra-01", "target-01"], notes: "Entrenamiento intensivo", createdAt: now, updatedAt: now },
  { id: "t-long", name: "Equipo Gran Fondo", pigeonIds: ["g1-02", "extra-02"], createdAt: now, updatedAt: now },
];

export const mockPairs: Pair[] = [
  { id: "pr-1", cockId: "g2-01", henId: "g2-02", seasonId: "s-2024", nestBox: "B-01", startDate: "2024-02-10", status: "active", createdAt: now, updatedAt: now },
  { id: "pr-2", cockId: "g1-01", henId: "g1-02", seasonId: "s-2025", nestBox: "A-05", startDate: "2025-01-15", status: "active", notes: "Cruce consanguíneo Storm x Luna", createdAt: now, updatedAt: now },
];

export const mockMedications: Medication[] = [
  { id: "m-1", date: "2025-03-01", name: "Tricho-Plus", reason: "Prevención tricomoniasis", dose: "5ml/L", withdrawalDays: 3, createdAt: now, updatedAt: now },
  { id: "m-2", date: "2025-04-15", name: "Ornicure", reason: "Tratamiento respiratorio", dose: "1 sobre/2L", pigeonIds: ["g1-01"], withdrawalDays: 7, createdAt: now, updatedAt: now },
];

export const mockJournal: JournalEntry[] = [
  { id: "j-1", date: "2025-05-01", title: "Limpieza profunda", body: "Desinfectado todo el palomar de reproducción con Virkon S.", tags: ["mantenimiento"], createdAt: now, updatedAt: now },
  { id: "j-2", date: "2025-05-05", title: "Primer huevo Legend", body: "La pareja Storm x Luna ha puesto su primer huevo. Muy buen tamaño.", tags: ["reproducción"], createdAt: now, updatedAt: now },
];

export const mockRaces: Race[] = [
  { 
    id: "r-1", name: "Barcelona Classic 2024", date: "2024-07-12", 
    stationId: "st-bcn", distanceKm: 1142, totalBirds: 18420, 
    liberationTime: "06:45", releaseTemp: "22°C", releaseWeather: "Soleado",
    pigeonIds: ["g1-01", "g1-02"],
    results: [
      { pigeonId: "g1-01", arrivalTime: "07:15", position: 1, speed: 1347 },
      { pigeonId: "g1-02", arrivalTime: "08:30", position: 42, speed: 1210 }
    ],
    createdAt: now, updatedAt: now 
  },
];

export const mockBands: BandCollection[] = [
  { id: "b-1", countryPrefix: "ES", year: "2025", fromNumber: 100001, toNumber: 100050, notes: "Serie principal 2025", createdAt: now, updatedAt: now },
];
