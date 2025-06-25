export interface Person {
  id: string;
  name: string;
  gender: string;
  dob: string;
  father: string | null;
  mother: string | null;
  partner: string[];
}