import { Person } from "../types/person";

export const setupGenerations = (familyData: Person[]) => {
  const personMap = new Map(familyData.map((p) => [p.id, p]));
  const generationMap = new Map<string, number>();

  function getGeneration(id: string): number {
    if (generationMap.has(id)) return generationMap.get(id)!;
    const person = personMap.get(id);
    if (!person) return 0;
    
    // For root nodes (no parents), set generation to 0
    if (!person.father && !person.mother) {
      generationMap.set(id, 0);
      return 0;
    }

    // Calculate generation based on parents
    const fatherGen = person.father ? getGeneration(person.father) : 0;
    const motherGen = person.mother ? getGeneration(person.mother) : 0;
    const gen = Math.max(fatherGen, motherGen) + 1;
    generationMap.set(id, gen);
    return gen;
  }

  familyData.forEach((p) => getGeneration(p.id));
  return generationMap;
};