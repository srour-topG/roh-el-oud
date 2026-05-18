import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "flowbite-react";
import { Datepicker } from 'flowbite-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { FaRegEyeSlash } from "react-icons/fa";
import { FaRegEye } from "react-icons/fa";
import { updateUser } from '../../services/auth';

function UserDataModal({  setResponse, openDataModal, setOpenDataModal, data, setToast,dataRender, setDataRender,reRender, setRerender }) {

	const SignupSchema = Yup.object().shape({
			name: Yup.string().required('الإسم مطلوب'),
			username: Yup.string().required(' إسم المستخدم مطلوب '),
			password: Yup.string().required('  كلمة المرور مطلوبة '),
			role: Yup.string().required(' الوظيفة مطلوبة'),
	
	
			mobile: Yup.string().required('رقم الموبايل مطلوب'),
			qualification: Yup.string().required('المؤهل مطلوب'),
			salary: Yup.number().required('الراتب مطلوب'),
			hiringDate: Yup.date().required('تاريخ التوظيف مطلوب'),
	
		});
	
		const [passordShown, setPasswordShown] = useState(false)

		console.log(data)
	
	return (
		
		<Modal className="dark:bg-gray-900/50  bg-white " show={openDataModal} onClose={() => setOpenDataModal(false)}>

			{console.log(data)}
			<ModalHeader className="!flex !items-center justify-center border-0 dark:bg-white">
			</ModalHeader>
			<ModalBody className="  dark:bg-white   " >
				<div className='w-90 m-auto'>
						<Formik
						initialValues={{
							id:data?.id,
							name: data?.name,
							mobile: data?.phone,
							salary: data?.salary,
							qualification: data?.qualification,
							hiringDate: data?.hiringDate,
							username: data?.username,
							password: data?.password,
							role: data?.role


						}}
						validationSchema={SignupSchema}
						onSubmit={async (values) => {
							setResponse(null);
							setToast(false);

							try {
								const response = await updateUser(values);
								console.log('update successful:', response.data);
								setResponse(response.data)
								setToast(true)
								setOpenDataModal(false)
								setRerender(!reRender)

								setTimeout(() => {
									setToast(false)
								}, 3000);

						
								// You can redirect or show a success message here
							} catch (error) {
								console.error('update failed:', error.response?.data || error.message);
								// Show error message to user if needed
								setResponse(error.response?.data || error.message)
								setToast(true)
								setOpenDataModal(false)

								setTimeout(() => {
									setToast(false)
								}, 3000);
							}
						}}

					>
						{({ errors, touched, handleChange, handleBlur, values, setFieldValue }) => (
							<Form>
								<div class="mb-3">
									<input
										name="name"
										type="text"
										onChange={handleChange}
										onBlur={handleBlur}
										value={values.name}
										class={`bg-gray-50 ${errors.name && touched.name ? 'border-red-500' : 'border-gray-300'} border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  bg-gray-200  border-gray-6200  placeholder-gray-400  font-semibold text-right focus:ring-blue-500  focus:border-blue-500`} placeholder="الإسم بالكامل" />
								</div>
								<div className='h-[30px]'>
									{touched.name && errors.name && (
										<div className="text-red-500 text-[13px] h-[30px] text-right mt-1">{errors.name}</div>
									)}
								</div>

								<div class="mb-3">
									<input
										name="username"
										type="text"
										onChange={handleChange}
										onBlur={handleBlur}
										value={values.username}
										class={`bg-gray-50 ${errors.username && touched.username ? 'border-red-500' : 'border-gray-300'} border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  bg-gray-200  border-gray-6200  placeholder-gray-400  font-semibold text-right focus:ring-blue-500  focus:border-blue-500`} placeholder="إسم المستخدم" />
								</div>
								<div className='h-[30px]'>
									{touched.username && errors.username && (
										<div className="text-red-500 text-[13px] h-[30px] text-right mt-1">{errors.username}</div>
									)}
								</div>



								<div class="mb-3">
									<select
										name="role"
										type="text"
										onChange={handleChange}
										onBlur={handleBlur}
										value={values.role}
										class={`bg-gray-50 ${errors.role && touched.role ? 'border-red-500' : 'border-gray-300'} border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  bg-gray-200  border-gray-6200  placeholder-gray-400  font-semibold text-right focus:ring-blue-500  focus:border-blue-500`} placeholder="الإسم بالكامل" >
										<option selected disabled >الوظيفة</option>

										<option value="admin">Admin</option>
										<option value="captin">مدرب</option>
										<option value="receptionist">موظفة استقبال</option>


									</select>
								</div>

								<div className='h-[30px]'>
									{touched.role && errors.role && (
										<div className="text-red-500 text-[13px] h-[30px] text-right mt-1">{errors.role}</div>
									)}
								</div>



								<div class="relative">
									<div class="absolute inset-y-0 start-0 flex items-center ps-3  z-10pointer-events-none">

										{passordShown ? (<FaRegEye onClick={() => setPasswordShown(!passordShown)} color='gray' />) : (<FaRegEyeSlash onClick={() => setPasswordShown(!passordShown)} color='gray' />)}
									</div>
									<input
										name="password"
										class={`bg-gray-50 ${errors.password && touched.password ? 'border-red-500' : 'border-gray-300'} border border-gray-300   text-gray-900 text-sm rounded-lg   focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  bg-gray-200  border-gray-6200  placeholder-gray-400  font-semibold text-right focus:ring-blue-500  focus:border-blue-500`}
										onChange={handleChange}
										onBlur={handleBlur}
										value={values.password}
										type={passordShown ? "text" : "password"} id="search" placeholder="كلمة المرور" />
								</div>

								<div className='h-[30px]'>
									{touched.password && errors.password && (
										<div className="text-red-500 text-[13px] h-[30px] text-right mt-1">{errors.password}</div>
									)}
								</div>


								<div class="mb-3">
									<input
										name="mobile"
										type="text"
										onChange={handleChange}
										onBlur={handleBlur}
										value={values.mobile}
										class={`bg-gray-50 ${errors.mobile && touched.mobile ? 'border-red-500' : 'border-gray-300'} border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  bg-gray-200  border-gray-6200  placeholder-gray-400  font-semibold text-right focus:ring-blue-500  focus:border-blue-500`} placeholder="موبايل" />
								</div>

								<div className='h-[30px]'>

									{touched.mobile && errors.mobile && (
										<div className="text-red-500 text-[13px] text-right mt-6">{errors.mobile}</div>
									)}

								</div>
								<div class="mb-3">
									<input
										name="qualification"
										type="text"
										onChange={handleChange}
										onBlur={handleBlur}
										value={values.qualification}
										class={`bg-gray-50 ${errors.qualification && touched.qualification ? 'border-red-500' : 'border-gray-300'} border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  bg-gray-200  border-gray-6200  placeholder-gray-400  font-semibold text-right focus:ring-blue-500  focus:border-blue-500`} placeholder="المؤهل" />
								</div>
								<div className='h-[30px]'>

									{touched.qualification && errors.qualification && (
										<div className="text-red-500 text-[13px] text-right mt-1">{errors.qualification}</div>
									)}

								</div>

								<div class="mb-3">
									<Datepicker

										class={`bg-gray-50 ${errors.salary && touched.salary ? 'border-red-500' : 'border-gray-300'} border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  bg-gray-200  border-gray-6200  placeholder-gray-400  font-semibold text-right focus:ring-blue-500  focus:border-blue-500`}
										format="MM-dd-yyyy"

										onChange={(date) => {
											// Format the date for display/logging purposes (optional)
											const formatted = format(date, 'dd-MM-yyyy');
											console.log('Selected date:', formatted);
											// Set the date in Formik's state
											setFieldValue('hiringDate', formatted);
										}}
										minDate={new Date(2023, 0, 1)}
									/>
									<div className='h-[30px]'>
										{touched.hiringDate && errors.hiringDate && (
											<div className="text-red-500 text-[13px] h-[30px] text-right mt-1">{errors.hiringDate}</div>
										)}
									</div>
								</div>

								<div class="mb-3">
									<input
										name="salary"
										type="text"
										onChange={handleChange}
										onBlur={handleBlur}
										value={values.salary}
										class={`bg-gray-50 ${errors.salary && touched.salary ? 'border-red-500' : 'border-gray-300'} border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  bg-gray-200  border-gray-6200  placeholder-gray-400  font-semibold text-right focus:ring-blue-500  focus:border-blue-500`} placeholder="الراتب" />
								</div>
								<div className='h-[30px]'>

									{touched.salary && errors.salary && (
										<div className="text-red-500 text-[13px] text-right mt-1">{errors.salary}</div>
									)}

								</div>

								<button className='bg-[#344685] w-90 mt-4' type="submit">تأكيد</button>
							</Form>
						)}
					</Formik>
				</div>
			</ModalBody>

		</Modal>
	)
}

export default UserDataModal