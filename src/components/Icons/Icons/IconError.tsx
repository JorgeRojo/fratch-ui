import IconContainer from '../components/IconContainer';
import { IconProps } from './IconProps';

export default function IconError({ type, className }: IconProps): JSX.Element {
  return (
    <IconContainer className={className} type={type}>
      {({ iconClassName }): JSX.Element => (
        <svg
          className={iconClassName}
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 20 20"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m13 7-6 6m0-6 6 6m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      )}
    </IconContainer>
  );
}
