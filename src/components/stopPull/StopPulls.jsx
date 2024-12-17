import PropTypes from "prop-types";
export function StopPulls({ onClick }) {
  return (
    <button
      className="text-[#ACACAC] hover:text-[#009BF5] text-sm transform-color ease-in-out duration-300 cursor-pointer font-dmSans"
      onClick={onClick}
    >
      <h3 className="underline">Do you need stop pull?</h3>
    </button>
  );
}
StopPulls.propTypes = {
  onClick: PropTypes.func.isRequired,
};
