// Shapes follow the DVSA MOT History API, DVLA Vehicle Enquiry Service and
// the OBDEX server's HPI format.

export type Defect = {
  text: string;
  type: 'ADVISORY' | 'MINOR' | 'MAJOR' | 'DANGEROUS' | 'FAIL' | 'PRS' | 'USER ENTERED' | 'NON SPECIFIC' | 'SYSTEM GENERATED';
  dangerous?: boolean;
};

export type MotTest = {
  completedDate: string;
  testResult: 'PASSED' | 'FAILED';
  expiryDate?: string | null;
  odometerValue?: string;
  odometerUnit?: 'MI' | 'KM' | null;
  odometerResultType?: 'READ' | 'UNREADABLE' | 'NO_ODOMETER';
  motTestNumber?: string;
  defects?: Defect[];
};

export type MotVehicle = {
  registration: string;
  make: string;
  model: string;
  firstUsedDate: string;
  registrationDate?: string;
  manufactureDate?: string;
  fuelType?: string;
  primaryColour?: string;
  engineSize?: string;
  hasOutstandingRecall?: string;
  motTestDueDate?: string;
  motTests: MotTest[];
};

export type DvlaVehicle = {
  registrationNumber: string;
  taxStatus?: string;
  taxDueDate?: string;
  motStatus?: string;
  motExpiryDate?: string;
  make?: string;
  monthOfFirstRegistration?: string;
  yearOfManufacture?: number;
  engineCapacity?: number;
  co2Emissions?: number;
  fuelType?: string;
  markedForExport?: boolean;
  colour?: string;
  typeApproval?: string;
  wheelplan?: string;
  revenueWeight?: number;
  euroStatus?: string;
  realDrivingEmissions?: string;
  dateOfLastV5CIssued?: string;
};

export type Hpi = {
  provider: string;
  outstandingFinance: { agreements?: number; lender?: string; agreementType?: string } | null;
  stolen: { reportedDate?: string; policeForce?: string } | null;
  writeOff: { category: string; lossDate?: string; description?: string } | null;
  scrapped: boolean;
  imported: boolean;
  exported: boolean;
  plateChanges: { date: string; from: string }[];
  colourChanges: { date: string; from: string }[];
  previousKeepers: number | null;
  vinLast4?: string | null;
};

export type VehicleReport = {
  registration: string;
  sources: { mot: string; dvla: string; hpi: string };
  mot: MotVehicle;
  dvla: DvlaVehicle | null;
  hpi: Hpi;
};
