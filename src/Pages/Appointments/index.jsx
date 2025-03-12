/* eslint-disable react/prop-types */
import {
  Avatar,
  Badge,
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Divider,
  Flex,
  Grid, Input,
  Skeleton,
  Text, useDisclosure,
  useToast
} from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GET } from "../../Controllers/ApiControllers";
import admin from "../../Controllers/admin";
import { useNavigate } from "react-router-dom";
import getStatusBadge from "../../Hooks/StatusBadge";
import AddNewAppointment from "./AddNewAppointment";
import { useEffect, useRef, useState } from "react";
import Pagination from "../../Components/Pagination";
import ErrorPage from "../../Components/ErrorPage";
import useHasPermission from "../../Hooks/HasPermission";
import NotAuth from "../../Components/NotAuth";
import moment from "moment";
import { RefreshCwIcon } from "lucide-react";
import DateRangeCalender from "../../Components/DateRangeCalender";
import getStatusColor from "../../Hooks/GetStatusColor";

const getPageIndices = (currentPage, itemsPerPage) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  let endIndex = startIndex + itemsPerPage - 1;
  return { startIndex, endIndex };
};

export default function Appointments() {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const id = "Errortoast";
  const [page, setPage] = useState(1);
  const boxRef = useRef(null);
  const [searchQuery, setsearchQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState([]); // Track status filters
  const { startIndex, endIndex } = getPageIndices(page, 50);
  const { hasPermission } = useHasPermission();
  const queryClient = useQueryClient();
  const [dateRange, setdateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const debouncedSearchQuery = useDebounce(searchQuery, 1000);
  const start_date = dateRange.startDate
    ? moment(dateRange.startDate).format("YYYY-MM-DD")
    : "";
  const end_date = dateRange.endDate
    ? moment(dateRange.endDate).format("YYYY-MM-DD")
    : "";

  const handleStatusChange = (selectedStatuses) => {
    setStatusFilters(selectedStatuses); // Update the state when checkboxes change
  };

  const getData = async () => {
    const url =
      admin.role.name === "Doctor"
        ? `GetAll_appointment/doctor_id/page?start=${startIndex}&end=${endIndex}&doctor_id=${
            admin.id
          }&search=${debouncedSearchQuery}&start_date=${start_date}&end_date=${end_date}&status=${statusFilters.join(
            ", "
          )}`
        : `GetAll_appointment?start=${startIndex}&end=${endIndex}&search=${debouncedSearchQuery}&start_date=${start_date}&end_date=${end_date}&status=${statusFilters.join(
            ", "
          )}`;
    console.log(url);
    const res = await GET(admin.token, url);
    return res.data;
  };

  const { isLoading, data, error, isFetching, isRefetching } = useQuery({
    queryKey: [
      "appointments-page",
      page,
      debouncedSearchQuery,
      statusFilters,
      dateRange,
    ],
    queryFn: getData,
  });

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };
  const totalPage = Math.ceil(1000 / 50);

  useEffect(() => {
    if (boxRef.current) {
      boxRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [page]);

  if (error) {
    if (!toast.isActive(id)) {
      toast({
        id,
        title: "Oops!",
        description: "Something bad happened.",
        status: "error",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
    }
    return <ErrorPage errorCode={error.name} />;
  }

  if (!hasPermission("APPOINTMENT_VIEW")) return <NotAuth />;

  return (
    <Box ref={boxRef}>
      {isLoading || !data ? (
        <Box>
          <Flex mb={5} justify={"space-between"}>
            <Skeleton w={400} h={8} />
            <Skeleton w={200} h={8} />
          </Flex>
          {/* Loading skeletons */}
          <Grid
            templateColumns={{
              base: "1fr",
              md: "repeat(2, 1fr)",
              xl: "repeat(3, 1fr)",
              "2xl": "repeat(4, 1fr)",
            }}
            gap={{ base: 4, md: 4, xl: 8 }}
            p={4}
          >
            {" "}
            {[...Array(16)].map((_, index) => (
              <Skeleton key={index} h={32} mt={2} borderRadius={6} />
            ))}
          </Grid>
        </Box>
      ) : (
        <Box>
          <Flex mb={5} justify={"space-between"} align={"center"}>
            <Flex align={"center"} gap={4}>
              <Input
                size={"md"}
                placeholder="Search"
                w={400}
                maxW={"50vw"}
                onChange={(e) => setsearchQuery(e.target.value)}
                value={searchQuery}
              />
              <DateRangeCalender
                dateRange={dateRange}
                setDateRange={setdateRange}
                size={"md"}
              />
            </Flex>
            <Box>
              <Button
                size={"sm"}
                colorScheme="blue"
                onClick={() => {
                  onOpen();
                }}
                isDisabled={!hasPermission("APPOINTMENT_ADD")}
              >
                Add New
              </Button>
            </Box>
          </Flex>

          {/* Status checkboxes */}
          <Flex alignItems={"top"} justifyContent={"space-between"}>
            {" "}
            <CheckboxGroup
              colorScheme="blue"
              onChange={handleStatusChange}
              value={statusFilters}
            >
              <Flex mb={5} gap={4} alignItems={"center"}>
                <Checkbox value="Confirmed">Confirmed</Checkbox>
                <Checkbox value="Visited">Visited</Checkbox>
                <Checkbox value="Completed">Completed</Checkbox>
                <Checkbox value="Pending">Pending</Checkbox>
                <Checkbox value="Cancelled">Cancelled</Checkbox>
                <Checkbox value="Rejected">Rejected</Checkbox>
              </Flex>
            </CheckboxGroup>{" "}
            <Button
              isLoading={isFetching || isRefetching}
              size={"sm"}
              colorScheme="blue"
              onClick={() => {
                queryClient.invalidateQueries(
                  ["appointments", page, debouncedSearchQuery, statusFilters],
                  { refetchInactive: true }
                );
              }}
              rightIcon={<RefreshCwIcon size={14} />}
            >
              Refresh Table
            </Button>
          </Flex>
          <Box>
            <Grid
              templateColumns={{
                base: "1fr",
                md: "repeat(2, 1fr)",
                xl: "repeat(3, 1fr)",
                "2xl": "repeat(4, 1fr)",
              }}
              gap={{ base: 4, md: 4, xl: 8 }}
              p={4}
            >
              {data?.map((appointment) => (
                <Box
                  key={appointment.id}
                  p={4}
                  borderRadius="md"
                  boxShadow="lg"
                  border={"1px solid"}
                  borderColor={getStatusColor(appointment.status)}
                  cursor={"pointer"}
                  transition={"transform 0.2s ease-in-out"}
                  _hover={{
                    transform: "translateY(-2px)",
                    transition: "transform 0.2s ease-in-out",
                    boxShadow: "xl",
                  }}
                  onClick={() => navigate(`/appointment/${appointment.id}`)}
                >
                  <Flex gap={4}>
                    <Avatar src={appointment.doct_image} />{" "}
                    <Box>
                      {" "}
                      <Text fontWeight={"600"}>
                        Doctor: {appointment.doct_f_name}{" "}
                        {appointment.doct_l_name}
                      </Text>{" "}
                      <Text>
                        Patient: {appointment.patient_f_name}{" "}
                        {appointment.patient_l_name} #{appointment.patient_id}
                      </Text>
                    </Box>
                  </Flex>
                  <Divider my={3} />

                  <Flex justify={"space-between"} align={"center"}>
                    {" "}
                    <Text
                      fontSize={"sm"}
                      fontWeight={"600"}
                      color={"green.500"}
                    >
                      Date: {appointment.date}
                    </Text>
                    <Text
                      fontSize={"sm"}
                      fontWeight={"600"}
                      color={"green.500"}
                    >
                      Time: {appointment.time_slots}
                    </Text>
                  </Flex>
                  <Flex justify={"space-between"} align={"center"} mt={2}>
                    {" "}
                    <Text>
                      Type:{" "}
                      {appointment.type === "Emergency" ? (
                        <Badge colorScheme="red" py={"5px"}>
                          {appointment.type}
                        </Badge>
                      ) : appointment.type === "Video Consultant" ? (
                        <Badge colorScheme="purple" py={"5px"}>
                          {appointment.type}
                        </Badge>
                      ) : (
                        <Badge colorScheme="green" py={"5px"}>
                          {appointment.type}
                        </Badge>
                      )}
                    </Text>
                    <Text>Status: {getStatusBadge(appointment.status)}</Text>
                  </Flex>
                  <Flex justify={"space-between"} align={"center"} mt={2}>
                    {" "}
                    <Text fontSize={"sm"}>
                      Payment :{" "}
                      {appointment?.payment_status === "Paid" ? (
                        <Badge colorScheme="green">
                          {appointment.payment_status}
                        </Badge>
                      ) : appointment.payment_status === "Refunded" ? (
                        <Badge colorScheme="blue">
                          {appointment.payment_status}
                        </Badge>
                      ) : (
                        <Badge colorScheme="red">{"Not Paid"}</Badge>
                      )}
                    </Text>
                    <Text fontSize={"sm"}>
                      Source:{" "}
                      <Badge
                        colorScheme={
                          appointment.source === "Web" ? "purple" : "blue"
                        }
                      >
                        {appointment.source}
                      </Badge>
                    </Text>
                  </Flex>
                </Box>
              ))}
            </Grid>
            ;
          </Box>
        </Box>
      )}

      <Flex justify={"center"} mt={4}>
        <Pagination
          currentPage={page}
          onPageChange={handlePageChange}
          totalPages={totalPage}
        />
      </Flex>

      {/* Add New Appointment */}
      {isOpen && <AddNewAppointment isOpen={isOpen} onClose={onClose} />}
    </Box>
  );
}

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set a timeout to update the debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function to clear the timeout if value or delay changes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Dependency array

  return debouncedValue || "";
}
