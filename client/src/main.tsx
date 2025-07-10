import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize FontAwesome
import { library } from '@fortawesome/fontawesome-svg-core';
import { 
  faRecycle, faHome, faBottleWater, faHistory, 
  faMapMarkerAlt, faChartLine, faUserCircle, 
  faWallet, faBars, faCheckCircle, faTimes, 
  faInfoCircle, faExclamationTriangle, faCubes, 
  faLeaf, faArrowRight, faSpinner, faQrcode,
  faDownload, faCopy, faPlus, faMinus, faTrash,
  faSearch, faSave, faEdit, faTools, faCalendar,
  faIndustry, faBox, faBoxOpen, faCalendarAlt,
  faCogs, faCheck, faCircle, faUser, faGlobe,
  faUsers, faClock
} from '@fortawesome/free-solid-svg-icons';

library.add(
  faRecycle, faHome, faBottleWater, faHistory, 
  faMapMarkerAlt, faChartLine, faUserCircle, 
  faWallet, faBars, faCheckCircle, faTimes, 
  faInfoCircle, faExclamationTriangle, faCubes, 
  faLeaf, faArrowRight, faSpinner, faQrcode,
  faDownload, faCopy, faPlus, faMinus, faTrash,
  faSearch, faSave, faEdit, faTools, faCalendar,
  faIndustry, faBox, faBoxOpen, faCalendarAlt,
  faCogs, faCheck, faCircle, faUser, faGlobe,
  faUsers, faClock
);

createRoot(document.getElementById("root")!).render(<App />);
