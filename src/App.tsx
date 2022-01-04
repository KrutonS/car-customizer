import useDato, { CarsQuery, primaryQuery } from "./lib/datocms";

function App() {
	const {data} = useDato<CarsQuery>(primaryQuery)
  return (
    <div className="App">
		{data && JSON.stringify(data, null, 2)}
    </div>
  );
}

export default App;
