import classNames from "classnames";

type Cn = typeof classNames;
const cn: Cn = (...args) => {
   args.forEach((arg) => {
    if (typeof arg === "object" && arg !== null && "undefined" in arg)
      delete arg.undefined;
  });
	
  return classNames(args);
};

export default cn;