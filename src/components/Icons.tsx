import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props} />;
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        opacity="0.5"
        d="M4 11.25C3.58579 11.25 3.25 11.5858 3.25 12C3.25 12.4142 3.58579 12.75 4 12.75V12V11.25ZM4 12V12.75H20V12V11.25H4V12Z"
        fill="currentColor"
      />
      <path d="M14 6L20 12L14 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        opacity="0.5"
        d="M2.36395 12.9579C1.98451 10.3208 1.79478 9.00229 2.33524 7.87495C2.87571 6.7476 4.02607 6.06234 6.32679 4.69181L7.71163 3.86687C9.80092 2.62229 10.8456 2 11.9999 2C13.1542 2 14.1988 2.62229 16.2881 3.86687L17.673 4.69181C19.9737 6.06234 21.1241 6.7476 21.6645 7.87495C22.205 9.00229 22.0153 10.3208 21.6358 12.9579L21.357 14.8952C20.8696 18.2827 20.6259 19.9764 19.4509 20.9882C18.2758 22 16.5525 22 13.106 22H10.8938C7.44725 22 5.72397 22 4.54891 20.9882C3.37384 19.9764 3.13013 18.2827 2.64272 14.8952L2.36395 12.9579Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M15 18H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconBase>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M2 12C2 8.22876 2 6.34315 3.17157 5.17157C4.34315 4 6.22876 4 10 4H14C17.7712 4 19.6569 4 20.8284 5.17157C22 6.34315 22 8.22876 22 12V14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14V12Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path opacity="0.5" d="M7 4V2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path opacity="0.5" d="M17 4V2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path opacity="0.5" d="M2.5 9H21.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 17C18 17.5523 17.5523 18 17 18C16.4477 18 16 17.5523 16 17C16 16.4477 16.4477 16 17 16C17.5523 16 18 16.4477 18 17Z" fill="currentColor" />
      <path d="M18 13C18 13.5523 17.5523 14 17 14C16.4477 14 16 13.5523 16 13C16 12.4477 16.4477 12 17 12C17.5523 12 18 12.4477 18 13Z" fill="currentColor" />
      <path d="M13 17C13 17.5523 12.5523 18 12 18C11.4477 18 11 17.5523 11 17C11 16.4477 11.4477 16 12 16C12.5523 16 13 16.4477 13 17Z" fill="currentColor" />
      <path d="M13 13C13 13.5523 12.5523 14 12 14C11.4477 14 11 13.5523 11 13C11 12.4477 11.4477 12 12 12C12.5523 12 13 12.4477 13 13Z" fill="currentColor" />
      <path d="M8 17C8 17.5523 7.55228 18 7 18C6.44772 18 6 17.5523 6 17C6 16.4477 6.44772 16 7 16C7.55228 16 8 16.4477 8 17Z" fill="currentColor" />
      <path d="M8 13C8 13.5523 7.55228 14 7 14C6.44772 14 6 13.5523 6 13C6 12.4477 6.44772 12 7 12C7.55228 12 8 12.4477 8 13Z" fill="currentColor" />
    </IconBase>
  );
}

export function MagniferIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11.5" cy="11.5" r="9.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M18.5 18.5L22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconBase>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        opacity="0.5"
        d="M20 17.5C20 19.9853 20 22 12 22C4 22 4 19.9853 4 17.5C4 15.0147 7.58172 13 12 13C16.4183 13 20 15.0147 20 17.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </IconBase>
  );
}

export function DocumentsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M5 8C5 5.17157 5 3.75736 5.87868 2.87868C6.75736 2 8.17157 2 11 2H13C15.8284 2 17.2426 2 18.1213 2.87868C19 3.75736 19 5.17157 19 8V16C19 18.8284 19 20.2426 18.1213 21.1213C17.2426 22 15.8284 22 13 22H11C8.17157 22 6.75736 22 5.87868 21.1213C5 20.2426 5 18.8284 5 16V8Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path opacity="0.5" d="M5 4.07617C4.02491 4.17208 3.36857 4.38885 2.87868 4.87873C2 5.75741 2 7.17163 2 10.0001V14.0001C2 16.8285 2 18.2427 2.87868 19.1214C3.36857 19.6113 4.02491 19.828 5 19.9239" stroke="currentColor" strokeWidth="1.5" />
      <path opacity="0.5" d="M19 4.07617C19.9751 4.17208 20.6314 4.38885 21.1213 4.87873C22 5.75741 22 7.17163 22 10.0001V14.0001C22 16.8285 22 18.2427 21.1213 19.1214C20.6314 19.6113 19.9751 19.828 19 19.9239" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 13H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 9H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 17H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconBase>
  );
}

export function FileTextIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M15.3929 4.05365L14.8912 4.61112L15.3929 4.05365ZM19.3517 7.61654L18.85 8.17402L19.3517 7.61654ZM21.654 10.1541L20.9689 10.4592V10.4592L21.654 10.1541ZM3.17157 20.8284L3.7019 20.2981H3.7019L3.17157 20.8284ZM20.8284 20.8284L20.2981 20.2981L20.2981 20.2981L20.8284 20.8284ZM14 22V21.25H10V22V22.75H14V22ZM2 14H2.75V10H2H1.25V14H2ZM22 13.5629H21.25V14H22H22.75V13.5629H22ZM15.3929 4.05365L14.8912 4.61112L18.85 8.17402L19.3517 7.61654L19.8534 7.05907L15.8947 3.49618L15.3929 4.05365ZM22 13.5629H22.75C22.75 11.8745 22.7651 10.8055 22.3391 9.84897L21.654 10.1541L20.9689 10.4592C21.2349 11.0565 21.25 11.742 21.25 13.5629H22ZM19.3517 7.61654L18.85 8.17402C20.2034 9.3921 20.7029 9.86199 20.9689 10.4592L21.654 10.1541L22.3391 9.84897C21.9131 8.89241 21.1084 8.18853 19.8534 7.05907L19.3517 7.61654ZM10.0298 2V2.75C11.6116 2.75 12.2085 2.76158 12.7405 2.96573L13.0092 2.26552L13.2779 1.5653C12.4261 1.23842 11.498 1.25 10.0298 1.25V2ZM15.3929 4.05365L15.8947 3.49618C14.8087 2.51878 14.1297 1.89214 13.2779 1.5653L13.0092 2.26552L12.7405 2.96573C13.2727 3.16993 13.7215 3.55836 14.8912 4.61112L15.3929 4.05365ZM10 22V21.25C8.09318 21.25 6.73851 21.2484 5.71085 21.1102C4.70476 20.975 4.12511 20.7213 3.7019 20.2981L3.17157 20.8284L2.64124 21.3588C3.38961 22.1071 4.33855 22.4392 5.51098 22.5969C6.66182 22.7516 8.13558 22.75 10 22.75V22ZM2 14H1.25C1.25 15.8644 1.24841 17.3382 1.40313 18.489C1.56076 19.6614 1.89288 20.6104 2.64124 21.3588L3.17157 20.8284L3.7019 20.2981C3.27869 19.8749 3.02502 19.2952 2.88976 18.2892C2.75159 17.2615 2.75 15.9068 2.75 14H2ZM14 22V22.75C15.8644 22.75 17.3382 22.7516 18.489 22.5969C19.6614 22.4392 20.6104 22.1071 21.3588 21.3588L20.8284 20.8284L20.2981 20.2981C19.8749 20.7213 19.2952 20.975 18.2892 21.1102C17.2615 21.2484 15.9068 21.25 14 21.25V22ZM22 14H21.25C21.25 15.9068 21.2484 17.2615 21.1102 18.2892C20.975 19.2952 20.7213 19.8749 20.2981 20.2981L20.8284 20.8284L21.3588 21.3588C22.1071 20.6104 22.4392 19.6614 22.5969 18.489C22.7516 17.3382 22.75 15.8644 22.75 14H22ZM2 10H2.75C2.75 8.09318 2.75159 6.73851 2.88976 5.71085C3.02502 4.70476 3.27869 4.12511 3.7019 3.7019L3.17157 3.17157L2.64124 2.64124C1.89288 3.38961 1.56076 4.33855 1.40313 5.51098C1.24841 6.66182 1.25 8.13558 1.25 10H2ZM10.0298 2V1.25C8.15538 1.25 6.67442 1.24842 5.51887 1.40307C4.34232 1.56054 3.39019 1.8923 2.64124 2.64124L3.17157 3.17157L3.7019 3.7019C4.12453 3.27928 4.70596 3.02525 5.71785 2.88982C6.75075 2.75158 8.11311 2.75 10.0298 2.75V2Z"
        fill="currentColor"
      />
      <path d="M13 2.5V5C13 7.35702 13 8.53553 13.7322 9.26777C14.4645 10 15.643 10 18 10H22" stroke="currentColor" strokeWidth="1.5" />
      <path opacity="0.5" d="M6 14.5H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path opacity="0.5" d="M6 18H11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path opacity="0.5" d="M9 17.5C10.8167 18.7111 13.1833 18.7111 15 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path opacity="0.5" d="M17 14.5H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path opacity="0.5" d="M7 14.5H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconBase>
  );
}

export function BriefcaseIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M9 7.5V6.2A2.2 2.2 0 0 1 11.2 4h1.6A2.2 2.2 0 0 1 15 6.2V7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 10.5C3 9.11929 4.11929 8 5.5 8h13C19.8807 8 21 9.11929 21 10.5v7C21 18.8807 19.8807 20 18.5 20h-13C4.11929 20 3 18.8807 3 17.5v-7Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M3 13h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 13v1.5h2V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function BuildingsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M22 22L2 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path opacity="0.5" d="M21 22V6C21 4.11438 21 3.17157 20.4142 2.58579C19.8284 2 18.8856 2 17 2H15C13.1144 2 12.1716 2 11.5858 2.58579C11.1142 3.05733 11.0223 3.76022 11.0043 5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15 22V9C15 7.11438 15 6.17157 14.4142 5.58579C13.8284 5 12.8856 5 11 5H7C5.11438 5 4.17157 5 3.58579 5.58579C3 6.17157 3 7.11438 3 9V22" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 22V19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path opacity="0.5" d="M6 8H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path opacity="0.5" d="M6 11H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path opacity="0.5" d="M6 14H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconBase>
  );
}

export function TruckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M4 7.5C4 6.11929 5.11929 5 6.5 5h7C14.8807 5 16 6.11929 16 7.5V15H4V7.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M16 9h2.8c.56 0 1.09.25 1.45.68L22 12.1V15h-6V9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="17" r="1.8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18" cy="17" r="1.8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 15h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconBase>
  );
}

export function ClockCircleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle opacity="0.5" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8V12L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M12 2.8 13.8 8.2 19.2 10 13.8 11.8 12 17.2 10.2 11.8 4.8 10 10.2 8.2 12 2.8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M18.5 13.5 19.2 15.8 21.5 16.5 19.2 17.2 18.5 19.5 17.8 17.2 15.5 16.5 17.8 15.8 18.5 13.5Z" fill="currentColor" opacity="0.9" />
    </IconBase>
  );
}

export function HamburgerMenuIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path opacity="0.65" d="M4 12H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 17H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconBase>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <IconBase {...props} className={props.className ?? "h-5 w-5"}>
      <path
        d="M6 11C6 8.17157 6 6.75736 6.87868 5.87868C7.75736 5 9.17157 5 12 5H15C17.8284 5 19.2426 5 20.1213 5.87868C21 6.75736 21 8.17157 21 11V16C21 18.8284 21 20.2426 20.1213 21.1213C19.2426 22 17.8284 22 15 22H12C9.17157 22 7.75736 22 6.87868 21.1213C6 20.2426 6 18.8284 6 16V11Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M6 19C4.34315 19 3 17.6569 3 16V10C3 6.22876 3 4.34315 4.17157 3.17157C5.34315 2 7.22876 2 11 2H15C16.6569 2 18 3.34315 18 5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </IconBase>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        opacity="0.5"
        d="M20 11.25C20.4142 11.25 20.75 11.5858 20.75 12C20.75 12.4142 20.4142 12.75 20 12.75V12V11.25ZM20 12V12.75H4V12V11.25H20V12Z"
        fill="currentColor"
      />
      <path d="M10 6L4 12L10 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function RoundedMagniferIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M21.812 20.9748C21.7493 21.0695 21.636 21.1828 21.4094 21.4094C21.1828 21.636 21.0695 21.7493 20.9748 21.812C20.4202 22.1793 19.6699 21.99 19.3559 21.4036C19.3023 21.3035 19.2563 21.15 19.1643 20.843C19.0638 20.5076 19.0136 20.3398 19.0038 20.2218C18.9466 19.5268 19.5268 18.9466 20.2218 19.0038C20.3398 19.0136 20.5075 19.0638 20.843 19.1643C21.15 19.2563 21.3035 19.3023 21.4036 19.3559C21.99 19.6699 22.1793 20.4202 21.812 20.9748Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function CheckReadIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path opacity="0.5" d="M4 12.8999L7.14286 16.4999L15 7.49994" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20.0002 7.5625L11.4286 16.5625L11.0002 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function PlainIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M18.6357 15.6701L20.3521 10.5208C21.8516 6.02242 22.6013 3.77322 21.414 2.58595C20.2268 1.39869 17.9776 2.14842 13.4792 3.64788L8.32987 5.36432C4.69923 6.57453 2.88392 7.17964 2.36806 8.06698C1.87731 8.91112 1.87731 9.95369 2.36806 10.7978C2.88392 11.6852 4.69923 12.2903 8.32987 13.5005C8.91282 13.6948 9.2043 13.792 9.44793 13.9551C9.68404 14.1131 9.88687 14.316 10.0449 14.5521C10.208 14.7957 10.3052 15.0872 10.4995 15.6701C11.7097 19.3008 12.3148 21.1161 13.2022 21.6319C14.0463 22.1227 15.0889 22.1227 15.933 21.6319C16.8204 21.1161 17.4255 19.3008 18.6357 15.6701Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path opacity="0.5" d="M16.2116 8.84853C16.5061 8.55727 16.5087 8.0824 16.2174 7.78789C15.9262 7.49338 15.4513 7.49075 15.1568 7.78201L15.6842 8.31527L16.2116 8.84853ZM10.1353 13.803L10.6626 14.3363L16.2116 8.84853L15.6842 8.31527L15.1568 7.78201L9.60787 13.2698L10.1353 13.803Z" fill="currentColor" />
    </IconBase>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </IconBase>
  );
}

export function PenNewSquareIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M4 20h4l10.5-10.5a1.8 1.8 0 0 0 0-2.5l-1.5-1.5a1.8 1.8 0 0 0-2.5 0L4 16v4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14.5 5.5 18.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 17l1.5-.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconBase>
  );
}

export function AddSquareIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        opacity="0.5"
        d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M15 12L12 12M12 12L9 12M12 12L12 9M12 12L12 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconBase>
  );
}

export function Pen2Icon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path opacity="0.5" d="M4 22H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M14.6296 2.92142L13.8881 3.66293L7.07106 10.4799C6.60933 10.9416 6.37846 11.1725 6.17992 11.4271C5.94571 11.7273 5.74491 12.0522 5.58107 12.396C5.44219 12.6874 5.33894 12.9972 5.13245 13.6167L4.25745 16.2417L4.04356 16.8833C3.94194 17.1882 4.02128 17.5243 4.2485 17.7515C4.47573 17.9787 4.81182 18.0581 5.11667 17.9564L5.75834 17.7426L8.38334 16.8675L8.3834 16.8675C9.00284 16.6611 9.31256 16.5578 9.60398 16.4189C9.94775 16.2551 10.2727 16.0543 10.5729 15.8201C10.8275 15.6215 11.0583 15.3907 11.5201 14.929L11.5201 14.9289L18.3371 8.11195L19.0786 7.37044C20.3071 6.14188 20.3071 4.14999 19.0786 2.92142C17.85 1.69286 15.8581 1.69286 14.6296 2.92142Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path opacity="0.5" d="M13.8879 3.66309C13.8879 3.66309 13.9806 5.23878 15.3709 6.6291C16.7613 8.01942 18.337 8.11211 18.337 8.11211M5.75821 17.7427L4.25732 16.2418" stroke="currentColor" strokeWidth="1.5" />
    </IconBase>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M4 20h4l10.5-10.5a1.8 1.8 0 0 0 0-2.5l-1.5-1.5a1.8 1.8 0 0 0-2.5 0L4 16v4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m14.5 5.5 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 6V4.8A1.8 1.8 0 0 1 10.8 3h2.4A1.8 1.8 0 0 1 15 4.8V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 6l1 14h8l1-14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 10v6M14 10v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconBase>
  );
}

export function TrashBinTrashIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 6V4.8A1.8 1.8 0 0 1 10.8 3h2.4A1.8 1.8 0 0 1 15 4.8V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 6.5h9L16 20H8L7.5 6.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10.5 10.5v5M13.5 10.5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 2.75h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconBase>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M10 4.5h-3A2.5 2.5 0 0 0 4.5 7v10A2.5 2.5 0 0 0 7 19.5h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 8.5 18 12.5 14 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 12.5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconBase>
  );
}

export function ProgressIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 18.5h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 15.5 10 11.5 13 13.5 18 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 7.5h1.5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="15.5" r="1.2" fill="currentColor" />
      <circle cx="10" cy="11.5" r="1.2" fill="currentColor" />
      <circle cx="13" cy="13.5" r="1.2" fill="currentColor" />
      <circle cx="18" cy="7.5" r="1.2" fill="currentColor" />
    </IconBase>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3.5V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 10.5 12 14.5 16 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 18.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconBase>
  );
}
