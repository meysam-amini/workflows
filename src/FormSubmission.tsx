import { useState } from "react";

export function FormSubmission() {

    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    const [sumbited, setSubmited] = useState(false);

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = (e) => {

        e.preventDefault();
        console.log('Form submitted:', formData);
        setSubmited(true);
        setTimeout(() => setSubmited(false), 3000);

    }


    return (
        <>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Username"
                    required
                />

                <br />
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    required
                    style={{ marginTop: '10px' }}

                />

                <br />

                <button type="submit" style={{ marginTop: '10px' }}>
                    Submit
                </button>
            </form>
            {sumbited && (
                <div style={{ marginTop: '10px', color: "green" }}>
                    ✅ Form submitted successfully!
                </div>
            )}

        </>
    )

}