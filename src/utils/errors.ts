export class MismatchError extends Error{
	constructor(name1:string, ...name2:string[]){
		super(`Mismatch between ${name1} and ${name2.reduce((a,b)=>`${a}, ${b}`)}`)
	}
}