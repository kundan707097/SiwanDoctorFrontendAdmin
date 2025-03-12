const getStatusColor = (status) => {
  switch (status) {
    case "Pending":
      return "yellow.200";
    case "Confirmed":
      return "green.200";
    case "Rejected":
    case "Cancelled":
      return "red.200";
    case "Completed":
      return "blue.200";
    case "Rescheduled":
      return "orange.200";
    case "Visited":
      return "purple.200";
    default:
      return "gray.200";
  }
};
export default getStatusColor;
