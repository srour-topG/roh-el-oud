
"use client";

import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "flowbite-react";
import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { editPackage } from "../../services/packages";

export function EditPackageModal({ openEditModal, setToast, editedPackage, setRerender, reRender, setOpenEditModal, setResponse }) {
	const SignupSchema = Yup.object().shape({
		name: Yup.string().required('الإسم مطلوب'),
		duration: Yup.string().required(' المدة مطلوبة'),
		count: Yup.string().required(' عدد التمرينات مطلوب'),
		price: Yup.string().required(' السعر مطلوب'),


	});


	return (
		<>
			<Modal dismissible show={openEditModal} onClose={() => setOpenEditModal(false)}>
				<ModalHeader className="bg-white dark:text-black"></ModalHeader>
				<ModalBody className="bg-white">
					<div className="mt-8 p-3 items-center text-center">
						<Formik
							initialValues={{
								id: editedPackage?.id,

								name: editedPackage?.type,
								duration: editedPackage?.duration,
								count: editedPackage?.count,
								price: editedPackage?.price,
							}}
							validationSchema={SignupSchema}
							onSubmit={async (values) => {
								setResponse(null);
								setToast(false);

								try {
									const response = await editPackage(values);
									setResponse(response.data)
									setToast(true)
									setOpenEditModal(false)

									setTimeout(() => {
										setToast(false)
									}, 3000);
									setRerender(!reRender)
									// You can redirect or show a success message here
								} catch (error) {
									console.error('Registration failed:', error.response?.data || error.message);
									setResponse(error.response?.data || error.message)
									setToast(true)

									setTimeout(() => {
										setToast(false)
									}, 3000);
								}
							}}

						>
							{({ errors, touched, handleChange, handleBlur, values, setFieldValue }) => (
								<Form>


									<div class="mb-3">
										<select
											name="name"
											type="text"

											onChange={handleChange}
											onBlur={handleBlur}
											value={values.name}
											class={`bg-gray-50 ${errors.name && touched.name ? 'border-red-500' : 'border-gray-300'} border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  bg-gray-200  border-gray-6200  placeholder-gray-400  font-semibold text-right focus:ring-blue-500  focus:border-blue-500`} placeholder="نوع الباقة"
											id="countries" >
											<option selected>نوع الباقة</option>
											<option value="تمرينة">تمرينة </option>
											<option value="شهري">شهري </option>
											<option value="سنوي">سنوي</option>
											<option value="نصف سنوي">نصف سنوي</option>
										</select>
									</div>
									<div className='h-[30px]'>
										{touched.name && errors.name && (
											<div className="text-red-500 text-[13px] h-[30px] text-right mt-1">{errors.name}</div>
										)}
									</div>

									<div class="mb-3">
										<input
											name="duration"
											type="text"
											onChange={handleChange}
											onBlur={handleBlur}
											value={values.duration}
											class={`bg-gray-50 ${errors.duration && touched.duration ? 'border-red-500' : 'border-gray-300'} border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  bg-gray-200  border-gray-6200  placeholder-gray-400  font-semibold text-right focus:ring-blue-500  focus:border-blue-500`} placeholder=" المدة (أيام)" />
									</div>
									<div className='h-[30px]'>
										{touched.duration && errors.duration && (
											<div className="text-red-500 text-[13px] h-[30px] text-right mt-1">{errors.duration}</div>
										)}
									</div>







									<div class="mb-3">
										<input
											name="count"
											type="text"
											onChange={handleChange}
											onBlur={handleBlur}
											value={values.count}
											class={`bg-gray-50 ${errors.count && touched.count ? 'border-red-500' : 'border-gray-300'} border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  bg-gray-200  border-gray-6200  placeholder-gray-400  font-semibold text-right focus:ring-blue-500  focus:border-blue-500`} placeholder="عدد التمرينات" />
									</div>

									<div className='h-[30px]'>

										{touched.count && errors.count && (
											<div className="text-red-500 text-[13px] text-right mt-6">{errors.count}</div>
										)}

									</div>
									<div class="mb-3">
										<input
											name="price"
											type="text"
											onChange={handleChange}
											onBlur={handleBlur}
											value={values.price}
											class={`bg-gray-50 ${errors.price && touched.price ? 'border-red-500' : 'border-gray-300'} border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  bg-gray-200  border-gray-6200  placeholder-gray-400  font-semibold text-right focus:ring-blue-500  focus:border-blue-500`} placeholder="السعر" />
									</div>
									<div className='h-[30px]'>

										{touched.price && errors.price && (
											<div className="text-red-500 text-[13px] text-right mt-1">{errors.price}</div>
										)}

									</div>


									<button className='bg-[#344685] w-90 mt-4' type="submit">تأكيد</button>
								</Form>
							)}
						</Formik>						</div>
				</ModalBody>

			</Modal>
		</>
	);
}
