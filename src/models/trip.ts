export interface Trip {
  id?: string;
  name: string;
  createdBy: string;
  shareCode: string;
  tripDate : Date;
  members: string[];
  createdAt: any;
}
