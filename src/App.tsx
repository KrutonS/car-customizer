import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { BrowserRouter as Router } from "react-router-dom";
import useDato, { PartsQuery, primaryQuery } from "./lib/datocms";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { setParts } from "./store/features/carSlice";
import Customizator from "./components/customizator";
import Content from "./components/content";
import Summary from "./components/summary";
import "react-toastify/dist/ReactToastify.css";
import "./styles/global.scss";
import Spinner from "./components/spinner";

function App() {
  const { data } = useDato<PartsQuery>(primaryQuery);
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector(({ car }) => car);

  useEffect(() => {
    data && dispatch(setParts(data));
  }, [data]);

  return (
    <>
      <ToastContainer />
      <Router>
        {isLoading ? (
          // <PacmanLoader />
					<Spinner />
        ) : (
          <Content left={<Customizator />} right={<Summary />} />
        )}
      </Router>
    </>
  );
}

export default App;
