import useDato, { CarsQuery, primaryQuery } from "./lib/datocms";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const { data } = useDato<CarsQuery>(primaryQuery);
  return (
    <>
      <div className='App'>{data && JSON.stringify(data, null, 2)}</div>
      <ToastContainer
      />
    </>
  );
}

export default App;
