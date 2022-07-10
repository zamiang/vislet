export default (name, len: any = 2) => {
  if (name.split(" ").length > 1) {
    return name
      .split(" ")
      .map((item) => item.substring(0, len))
      .join("");
  } else {
    return name.substring(0, len + 1);
  }
};
