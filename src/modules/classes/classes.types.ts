export interface ClassRecord {
  id: string;
  courseCode: string;
  courseName: string;
  building: string;
  room: string;
  weekdays: number[];
  startTime: string;
  endTime: string;
  isOnline: boolean;
  /** Null for an online class, which has no physical location. */
  latitude: number | null;
  /** Null for an online class, which has no physical location. */
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassInput {
  courseCode: string;
  courseName: string;
  building: string;
  room?: string;
  weekdays: number[];
  startTime: string;
  endTime: string;
  isOnline?: boolean;
  /** Resolved by the campus service (null when online); not accepted from the public API. */
  latitude?: number | null;
  /** Resolved by the campus service (null when online); not accepted from the public API. */
  longitude?: number | null;
}

export type UpdateClassInput = Partial<CreateClassInput>;

/**
 * Time fields as the API accepts them: a CSULB range in `time`, or a start
 * and end in 24-hour or AM/PM form. The service normalizes them to the
 * 24-hour `startTime`/`endTime` of `CreateClassInput`.
 */
export interface ClassTimeRequest {
  time?: string;
  startTime?: string;
  endTime?: string;
}

/** `building` may be omitted for an online class; in-person classes require it. */
export type CreateClassRequest =
  Omit<CreateClassInput, 'building' | 'startTime' | 'endTime' | 'latitude' | 'longitude'> &
  { building?: string } & ClassTimeRequest;

export type UpdateClassRequest = Partial<CreateClassRequest>;

export interface ClassesGateway {
  listClasses(accessToken: string): Promise<ClassRecord[]>;
  createClass(accessToken: string, userId: string, input: CreateClassInput): Promise<ClassRecord>;
  updateClass(accessToken: string, classId: string, input: UpdateClassInput): Promise<ClassRecord | null>;
  deleteClass(accessToken: string, classId: string): Promise<boolean>;
}
