import {
	AnchorHTMLAttributes,
	ButtonHTMLAttributes,
	forwardRef,
	MouseEventHandler,
	ReactNode,
	RefObject,
} from 'react';
import {Link} from 'react-router-dom';
import cn from 'classnames';

export type ButtonTypes = ButtonHTMLAttributes<HTMLButtonElement>['type'];
type ClickProps = {
	onClick?: MouseEventHandler;
	type?: ButtonTypes;
} & ButtonHTMLAttributes<HTMLButtonElement>;

type LinkProps = {
	href: string;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

export type ButtonProps = {
	className?: string;
	children: ReactNode;
} & (ClickProps | LinkProps);

const Button = forwardRef<HTMLElement | HTMLAnchorElement, ButtonProps>(
	({ children, className, ...props }, ref) => {
		// const { className = '', children } = props;
		const nodeClass = cn(className, 'btn');
		if ('href' in props) {
			const { href, ...attrs } = props;
			return (
				<Link to={href}>
					<a
						className={nodeClass}
						ref={ref as RefObject<HTMLAnchorElement>}
						{...attrs}
					>
						{children}
					</a>
				</Link>
			);
		}
		const { type = 'button', onClick, ...attrs } = props;
		return (
			<button
				type={type}
				onClick={onClick}
				className={nodeClass}
				ref={ref as RefObject<HTMLButtonElement>}
				{...attrs}
			>
				{children}
			</button>
		);
	}
);
Button.displayName = "button"
export default Button;
