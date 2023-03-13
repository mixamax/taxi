import { TForm } from "./types"

const cities = (window as any).data?.cities || []
const cityOptions = Object.keys(cities).map(key => ({ value: key, label: cities[key]['1'] }))

export const formFields: TForm = [
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
            required: [
                {
                    expression: [['type', '=', 'phone']],
                    result: true
                }
            ]
        }
    },
    {
        name: "u_email",
        label: "email",
        type: "email",
        validation: {
            required: [
                {
                    expression: [['type', '=', 'email']],
                    result: true
                }
            ]
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
                value: "phone"
            }
        ]
    },
    {
        name: "u_details.u_street",
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
        name: "u_details.u_zip",
        label: "zip_code"
    },
    {
        name: "u_details.u_card",
        label: "card_number",
        validation: {
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
        name: "car.car_model",
        type: "select",
        label: "Car models",
        options: {
            path: "car_models"
        }
    },
    {
        name: "car.seats",
        type: "select",
        label: "seats",
        options: [{"value":1,"label":"1"},{"value":2,"label":"2"},{"value":3,"label":"3"},{"value":4,"label":"4"},{"value":5,"label":"5"},{"value":6,"label":"6"},{"value":7,"label":"7"},{"value":8,"label":"8"},{"value":9,"label":"9"},{"value":10,"label":"10"},{"value":11,"label":"11"},{"value":12,"label":"12"},{"value":13,"label":"13"},{"value":14,"label":"14"},{"value":15,"label":"15"},{"value":16,"label":"16"},{"value":17,"label":"17"},{"value":18,"label":"18"},{"value":19,"label":"19"},{"value":20,"label":"20"}]
    },
    {
        name: "car.car_number",
        label: "Car number"
    },
    {
        name: "car.car_color",
        type: "select",
        label: "car_color",
        options: {
            path: "car_colors"
        }
    },
    {
        name: "car.car_classes",
        type: "select",
        label: "Car classes",
        options: {
            path: "car_classes"
        }
    }
]

export const form = {
    fields: formFields,
    submitText: 'signup'
}
