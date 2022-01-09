import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import useDato, { PartsQuery, primaryQuery } from "./lib/datocms";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { setParts } from "./store/features/carSlice";
import Customizator from "./components/customizator";
import Content from "./components/content";
import Summary from "./components/summary";
import "react-toastify/dist/ReactToastify.css";
import "./styles/global.scss";
import cn from "./utils/className";

function App() {
  const { data } = useDato<PartsQuery>(primaryQuery);
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector(({ car }) => car);

  useEffect(() => {
    data && dispatch(setParts(data));
  }, [data]);
console.log(cn("part-btn", {
	"btn--active": true,
	["part-btn--active"]: false,
	["part-btn--color"]: true
}));

  return (
    <>
      <ToastContainer />
      {isLoading ? (
        <h2>LOADING....</h2>
      ) : (
        <Content left={<Customizator />} right={<Summary />} />
      )}
    </>
  );
}

export default App;
