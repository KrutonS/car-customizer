import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import useDato, { PartsQuery, primaryQuery } from "./lib/datocms";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { ParamsId, setParts } from "./store/features/carSlice";
import Customizator from "./components/customizator";
import Content from "./components/content";
import Summary from "./components/summary";
import "react-toastify/dist/ReactToastify.css";
import "./styles/global.scss";
import Spinner from "./components/spinner";
import Head from "./components/head";

function App() {
  const { data } = useDato<PartsQuery>(primaryQuery);
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector(({ car }) => car);
  const [searchParams] = useSearchParams();

  const partsIds: ParamsId = [
    searchParams.get("model"),
    searchParams.get("engine"),
    searchParams.get("gearbox"),
    searchParams.get("color"),
  ];

  useEffect(() => {
    data && dispatch(setParts({ dato: data, paramsIds: partsIds }));
  }, [data]);

  return (
    <div className='App'>
      <Head />
      <ToastContainer theme='dark' />
      {isLoading ? (
        <Spinner />
      ) : (
        <Content left={<Customizator />} right={<Summary />} />
      )}
    </div>
  );
}

export default App;
