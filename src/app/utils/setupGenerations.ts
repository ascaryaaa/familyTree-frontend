import { Person } from "../types/person";


export const setupGenerations = (familyData: Person[]) => {
  const personMap = new Map(familyData.map((p) => [p.id, p]));
  const generationMap = new Map<string, number>();

  function getGeneration(id: string): number {
    if (generationMap.has(id)) return generationMap.get(id)!;
    const person = personMap.get(id);
    if (!person) return 0;
    const fatherGen = person.father ? getGeneration(person.father) + 1 : 0;
    const motherGen = person.mother ? getGeneration(person.mother) + 1 : 0;
    const gen = Math.max(fatherGen, motherGen);
    generationMap.set(id, gen);
    return gen;
  }

  familyData.forEach((p) => getGeneration(p.id));
  return generationMap;
};