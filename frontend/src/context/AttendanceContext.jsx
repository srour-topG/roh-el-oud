import { createContext, useCallback, useContext, useState } from "react";

const AttendanceContext = createContext();

export const AttendanceProvider = ({ children }) => {
  const [openModal, setOpenModal] = useState(false);
  const [preCheckOpenModal, setPreCheckOpenModal] = useState(false);
  const [personalData, setPersonalData] = useState(null);
  const [subData, setSubData] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const openQuickCheckIn = () => setOpenModal(true);

  return (
    <AttendanceContext.Provider
      value={{
        openModal,
        setOpenModal,
        preCheckOpenModal,
        setPreCheckOpenModal,
        personalData,
        setPersonalData,
        subData,
        setSubData,
        openQuickCheckIn,
        refreshKey,
        triggerRefresh,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => useContext(AttendanceContext);
