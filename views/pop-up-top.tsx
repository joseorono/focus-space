import logo from "url:~assets/logos/cubo 4.svg";
import ThemeSwitcher from "../components/theme-switcher";


export default function PopUpTop() {
  return (
    <>
      <div
        id="popup-top"
        className="flex items-center justify-between bg-[rgb(25,118,210)] px-4 py-2 text-white">
        <div className="flex items-center gap-2">
          <img src={logo} alt="FocusSpace Logo" className="w-6 h-6" />
          <h2 className="text-lg font-bold">FocusSpace</h2>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
        </div>
      </div>
    </>
  );
}