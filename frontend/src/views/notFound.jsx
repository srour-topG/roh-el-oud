import { BiSolidError } from "react-icons/bi";

function NotFound() {
	return (
		<div className="text-center items-center flex">
			<div className="m-auto flex flex-col">
				<BiSolidError className="items-center text-center m-auto" size={250} color="darkred" />

				<h4 className="text-3xl text-red-800 font-bold" >لا يوجد مشترك بهذا الكود</h4>
			</div>
		</div>
	)
}

export default NotFound