export const eur = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

export const EXPENSE_CATEGORIES = [
  "Casa",
  "Spesa",
  "Trasporti",
  "Bollette",
  "Svago",
  "Salute",
  "Viaggi",
  "Altro",
];

export const INCOME_CATEGORIES = ["Stipendio", "Freelance", "Regalo", "Rimborso", "Altro"];
