const generateId = (length: number, type: "number" | "uppercased" | "lowercased" | "mixed" = "mixed"): string => {
  let result = "";
  const characters = {
    number: "0123456789",
    uppercased: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lowercased: "abcdefghijklmnopqrstuvwxyz",
    mixed: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  };
  const charactersLength = characters[type].length;
  for (let i = 0; i < length; i++) {
    result += characters[type].charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
export { generateId };
