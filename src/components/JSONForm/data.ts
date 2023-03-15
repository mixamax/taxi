import { TForm } from "./types"

const cities = (window as any).data?.cities || []
const cityOptions = Object.keys(cities).map(key => ({ value: key, label: cities[key]['1'] }))

export const formFields: TForm = [
    {
        name: "u_role",
        type: "hidden",
        defaultValue: 2
    },
    {
        name: "work-type",
        type: "select",
        defaultValue: 0,
        options: [
            {
                label: "self_employed",
                value: 0
            }, {
                label: "company",
                value: 1
            }
        ],
        submit: false
    },
    {
        name: "u_name",
        label: [
            {
                expression: [
                    ['work-type', '=', '0']
                ],
                result: 'name'
            },
            {
                expression: [
                    ['work-type', '=', '1']
                ],
                result: 'company_name'
            }
        ],
        validation: {
            required: true
        }
    },
    {
        name: "u_phone",
        label: "phone",
        type: "phone",
        validation: {
            required: true,
            pattern: ["^[\+]?[0-9]{1,3}[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{3,6}$", "im"]
        }
    },
    {
        name: "u_email",
        label: "email",
        type: "email",
        validation: {
            required: true
        }
    },
    {
        name: "type",
        type: "radio",
        defaultValue: "email",
        options: [
            {
                label: "email",
                value: "email"
            },
            {
                label: "phone",
                value: "phone",
                disabled: true
            }
        ]
    },
    {
        name: "u_details.street",
        label: "street_address",
        validation: {
            required: true
        }
    },
    {
        name: "u_city",
        label: "city",
        options: cityOptions,
        validation: {
            required: true
        }
    },
    {
        name: "u_details.state",
        label: "state"
    },
    {
        name: "u_details.zip",
        label: "zip_code"
    },
    {
        name: "u_details.card",
        label: "card_number",
        placeholder: "XXXX-XXXX-XXXX-XXXX",
        validation: {
            required: true,
            length: 16
        }
    },
    {
        name: "u_details.passport_photo",
        label: "passport_photo",
        type: "file",
        multiple: true,
        accept: 'image/png, image/jpeg, image/jpg',
        validation: {
            required: true
        }
    },
    {
        name: "u_details.driver_license_photo",
        label: "driver_license_photo",
        type: "file",
        multiple: true,
        accept: 'image/png, image/jpeg, image/jpg',
        validation: {
            required: true
        }
    },
    {
        name: "u_details.license_photo",
        label: "license_photo",
        type: "file",
        multiple: true,
        accept: 'image/png, image/jpeg, image/jpg'
    },
    {
        name: "ref_code_toggle",
        label: "promo_code",
        type: "checkbox"
    },
    {
        name: "ref_code",
        visible: [
            {
                expression: [
                    ["ref_code_toggle", "=", true]
                ],
                result: true
            }
        ]
    },
    {
        name: "u_car.cm_id",
        type: "select",
        label: "Car models",
        options: {
            path: "car_models"
        }
    },
    {
        name: "u_car.seats",
        type: "select",
        label: "seats",
        options: [{"value":1,"label":"1"},{"value":2,"label":"2"},{"value":3,"label":"3"},{"value":4,"label":"4"},{"value":5,"label":"5"},{"value":6,"label":"6"},{"value":7,"label":"7"},{"value":8,"label":"8"},{"value":9,"label":"9"},{"value":10,"label":"10"},{"value":11,"label":"11"},{"value":12,"label":"12"},{"value":13,"label":"13"},{"value":14,"label":"14"},{"value":15,"label":"15"},{"value":16,"label":"16"},{"value":17,"label":"17"},{"value":18,"label":"18"},{"value":19,"label":"19"},{"value":20,"label":"20"}]
    },
    {
        name: "u_car.registration_plate",
        label: "Car number"
    },
    {
        name: "u_car.color",
        type: "select",
        label: "car_color",
        options: {
            path: "car_colors"
        }
    },
    {
        name: "u_car.cc_id",
        type: "select",
        label: "Car classes",
        options: {
            path: "car_classes"
        }
    },
    {
        component: "alert",
        props: {
            intent: "error",
            message: "register_fail"
        },
        visible: "@form.submitFailed"
    },
    {
        name: "submit",
        type: "submit",
        label: "signup",
        disabled: "@form.invalid"
    }
]

export const form = {
    fields: formFields
}