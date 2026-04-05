export interface Expense {
  tripId : string;
  id? : string;
  title: string;
  amount : number;
  date : Date ;
  paidBy : string;
  members : string[];
  notes? : string;
  createdAt: any;

  settlements?: Settlement[];

}

export interface Settlement {
  userId: string;
  paid: boolean;
}
