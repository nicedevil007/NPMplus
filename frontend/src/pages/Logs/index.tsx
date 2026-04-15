import { Navigate, Route, Routes } from "react-router-dom";
import { HasPermission } from "src/components";
import { ADMIN, VIEW } from "src/modules/Permissions";
import AccessLogs from "./AccessLogs";
import Crowdsec from "./Crowdsec";
import ErrorLogs from "./ErrorLogs";
import WafLogs from "./WafLogs";

const Logs = () => {
	return (
		<HasPermission section={ADMIN} permission={VIEW} pageLoading loadingNoLogo>
			<Routes>
				<Route path="access" element={<AccessLogs />} />
				<Route path="errors" element={<ErrorLogs />} />
				<Route path="waf" element={<WafLogs />} />
				<Route path="crowdsec" element={<Crowdsec />} />
				<Route path="*" element={<Navigate to="access" replace />} />
			</Routes>
		</HasPermission>
	);
};

export default Logs;
