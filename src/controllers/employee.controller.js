const { response } = require('express');
const multer = require("multer");
const cloudinary = require("../utils/cloudinary");
const Employee = require('../models/employee.model');
const Record = require('../models/record.model');

class EmployeeController {
    async create(req, res) {
        const { name, code, phone, email, identity, gender, technical } = req.body;

        try {
            let imageUrl = null;
            if (req.file) {
                const image = await cloudinary.uploader.upload(req.file.path);
                imageUrl = image.secure_url
            }

            const employee = await Employee.findOne({ email });
            if (employee && employee.isDelete == false) {
                return res.status(400).json({ success: false, message: 'Employee already exists' });
            }

            const technicalIds = JSON.parse(technical);

            const newEmployee = new Employee({
                name,
                code,
                phone,
                email,
                image: imageUrl,
                identity,
                gender,
                technical: technicalIds
            });

            await newEmployee.save();

            const newRecord = new Record({
                record: `add new employee ${newEmployee.name}`
            });
            newRecord.save();

            const employees = await Employee.find({isDelete: false}).populate('technical');

            res.json({ success: true, message: 'Employee added successfully', employees: employees });
            console.log(newEmployee)
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ success: false, message: 'Internal server error - Employee added failed' });
        }
    }

    async list(req, res) {
        try {
            const employees = await Employee.find({isDelete: false}).populate('technical');
            res.json({ success: true, employees })
        } catch (error) {
            console.log(error)
            res.status(500).json({ success: false, message: 'Internal server error' })
        }
    }

    details(req, res, next) {
        Employee.findOne({ _id: req.params._id }).populate('technical')
            .then(employee => res.json(employee))
            .catch(err => next(err));
    }

    async update(req, res) {
        const { name, code, phone, email, identity, gender, isAvailable, isManager, technical } = req.body;
        console.log(req.body);
        let imageUrl = null;
        if(req.file) {
            const image = await cloudinary.uploader.upload(req.file.path);
            imageUrl = image.secure_url
        }
        const employee = await Employee.find({ _id: req.params._id });
        const technicalIds = JSON.parse(technical);

        try {
            let updatedEmployee = {
                name: name || employee.name,
                code: code || employee.code,
                phone: phone || employee.phone,
                email: email || employee.email,
                image: imageUrl || employee.image,
                identity: identity || employee.identity,
                gender: gender || employee.gender,
                isAvailable: isAvailable || employee.isAvailable,
                isManager: isManager || employee.isManager,
                technical: technicalIds || employee.technical,
            }
            const updateCondition = { _id: req.params._id }

            updatedEmployee = await Employee.findByIdAndUpdate(updateCondition, updatedEmployee, { new: true });

            const newRecord = new Record({
                record: `updated employee ${name} information`
            });
            newRecord.save();

            if (!updatedEmployee)
                return res.status(401).json({ success: false, message: 'Employee not found' })

            res.json({ success: true, message: 'Employee updated successfully', employee: updatedEmployee })

        }
        catch (error) {
            console.log(error)
            res.status(500).json({ success: false, message: 'Internal server error - Employee updated failed' })
        }
    }

    async delete(req, res) {
        try {
            const employeeId = { _id: req.params._id }
            let deletedEmployee = {
                isDelete: true,
            }

            deletedEmployee = await Employee.findByIdAndUpdate(employeeId, deletedEmployee, { new: true });

            const newRecord = new Record({
                record: `removed employee ${deletedEmployee.name}`
            });
            newRecord.save();

            if (!deletedEmployee)
                return res.status(401).json({ success: false, message: 'Employee not found' })

            res.json({ success: true, message: 'Employee deleted successfully' })
        } catch (error) {
            console.log(error)
            res.status(404).json({ success: false, message: 'Internal Server Error - Employee deleted failed' })
        }
    }
}

module.exports = new EmployeeController;