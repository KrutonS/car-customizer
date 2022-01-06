import useDato, { PartsQuery, primaryQuery } from "./lib/datocms";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Customizator from "./components/customizator";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { setParts } from "./store/features/carSlice";
import { useEffect } from "react";
import './app.scss';

function App() {
  const { data } = useDato<PartsQuery>(primaryQuery);
  const dispatch = useAppDispatch();
  const { isLoading, ...carData } = useAppSelector(({ car }) => car);

  useEffect(() => {
    data && dispatch(setParts(data));
  }, [data]);

  return (
    <div className='App'>
      <ToastContainer />
      <main>{isLoading ? <h2>LOADING....</h2> : <Customizator />}</main>
    </div>
  );
}

export default App;
