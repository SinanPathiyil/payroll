import { useState } from "react";
import { X, Plus, Trash2, Building } from "lucide-react";
import { createClient } from "../../services/api";
import "../../styles/ba-modal.css";

export default function AddClientModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    industry: "",
    address: "",
    city: "",
    state: "",
    country: "",
    website: "",
    contract_start_date: "",
    contract_end_date: "",
    payment_terms: "",
    notes: "",
    contacts: [
      {
        name: "",
        designation: "",
        email: "",
        phone: "",
        is_primary: true,
      },
    ],
  });

  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleContactChange = (index, field, value) => {
    setFormData((prev) => {
      const newContacts = [...prev.contacts];
      newContacts[index] = { ...newContacts[index], [field]: value };
      return { ...prev, contacts: newContacts };
    });
  };

  const addContact = () => {
    setFormData((prev) => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        {
          name: "",
          designation: "",
          email: "",
          phone: "",
          is_primary: false,
        },
      ],
    }));
  };

  const removeContact = (index) => {
    if (formData.contacts.length > 1) {
      setFormData((prev) => ({
        ...prev,
        contacts: prev.contacts.filter((_, i) => i !== index),
      }));
    }
  };

  const setPrimaryContact = (index) => {
    setFormData((prev) => ({
      ...prev,
      contacts: prev.contacts.map((contact, i) => ({
        ...contact,
        is_primary: i === index,
      })),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.company_name.trim()) {
      newErrors.company_name = "Company name is required";
    }

    // Validate at least one contact
    const validContacts = formData.contacts.filter(
      (c) => c.name && c.email && c.phone
    );
    if (validContacts.length === 0) {
      newErrors.contacts = "At least one complete contact is required";
    }

    // Validate contact emails
    formData.contacts.forEach((contact, index) => {
      if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
        newErrors[`contact_email_${index}`] = "Invalid email format";
      }
    });

    // Validate dates
    if (
      formData.contract_start_date &&
      formData.contract_end_date &&
      new Date(formData.contract_start_date) >
        new Date(formData.contract_end_date)
    ) {
      newErrors.contract_end_date = "End date must be after start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Prepare data - filter out empty contacts
      const validContacts = formData.contacts.filter(
        (c) => c.name.trim() && c.email.trim() && c.phone.trim()
      );

      const clientData = {
        company_name: formData.company_name.trim(),
        industry: formData.industry.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        country: formData.country.trim() || null,
        website: formData.website.trim() || null,
        contract_start_date: formData.contract_start_date || null,
        contract_end_date: formData.contract_end_date || null,
        payment_terms: formData.payment_terms.trim() || null,
        notes: formData.notes.trim() || null,
        contacts: validContacts,
      };

      console.log("📤 Sending client data:", clientData);

      const response = await createClient(clientData);

      console.log("✅ Client created successfully:", response.data);
      
      // Success
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("❌ Failed to create client:", error);
      console.error("❌ Error response:", error.response?.data);
      setErrors({
        submit:
          error.response?.data?.detail ||
          "Failed to create client. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      company_name: "",
      industry: "",
      address: "",
      city: "",
      state: "",
      country: "",
      website: "",
      contract_start_date: "",
      contract_end_date: "",
      payment_terms: "",
      notes: "",
      contacts: [
        {
          name: "",
          designation: "",
          email: "",
          phone: "",
          is_primary: true,
        },
      ],
    });
    setErrors({});
    onClose();
  };

  return (
    <div className="ba-modal-overlay" onClick={handleClose}>
      <div
        className="ba-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ba-modal-header">
          <div className="ba-modal-header-content">
            <Building className="w-6 h-6" />
            <h2 className="ba-modal-title">Add New Client</h2>
          </div>
          <button className="ba-modal-close-btn" onClick={handleClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="ba-modal-body">
          {/* Error Message */}
          {errors.submit && (
            <div className="ba-alert ba-alert-error">{errors.submit}</div>
          )}

          {/* Company Information */}
          <div className="ba-form-section">
            <h3 className="ba-form-section-title">Company Information</h3>

            <div className="ba-form-grid">
              <div className="ba-form-group">
                <label className="ba-form-label">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  className={`ba-form-input ${errors.company_name ? "error" : ""}`}
                  placeholder="Enter company name"
                />
                {errors.company_name && (
                  <span className="ba-form-error">{errors.company_name}</span>
                )}
              </div>

              <div className="ba-form-group">
                <label className="ba-form-label">Industry</label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="ba-form-input"
                  placeholder="e.g., Technology, Finance"
                />
              </div>

              <div className="ba-form-group">
                <label className="ba-form-label">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="ba-form-input"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="ba-form-section">
            <h3 className="ba-form-section-title">Address</h3>

            <div className="ba-form-group">
              <label className="ba-form-label">Street Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="ba-form-input"
                placeholder="Enter street address"
              />
            </div>

            <div className="ba-form-grid ba-form-grid-3">
              <div className="ba-form-group">
                <label className="ba-form-label">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="ba-form-input"
                  placeholder="City"
                />
              </div>

              <div className="ba-form-group">
                <label className="ba-form-label">State/Province</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="ba-form-input"
                  placeholder="State"
                />
              </div>

              <div className="ba-form-group">
                <label className="ba-form-label">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="ba-form-input"
                  placeholder="Country"
                />
              </div>
            </div>
          </div>

          {/* Contacts */}
          <div className="ba-form-section">
            <div className="ba-form-section-header">
              <h3 className="ba-form-section-title">Contact Information</h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addContact}
              >
                <Plus className="w-4 h-4" />
                <span>Add Contact</span>
              </button>
            </div>

            {errors.contacts && (
              <div className="ba-alert ba-alert-warning">{errors.contacts}</div>
            )}

            {formData.contacts.map((contact, index) => (
              <div key={`contact-${index}`} className="ba-contact-item">
                <div className="ba-contact-item-header">
                  <h4 className="ba-contact-item-title">
                    Contact {index + 1}
                    {contact.is_primary && (
                      <span className="ba-badge ba-badge-primary">Primary</span>
                    )}
                  </h4>
                  <div className="ba-contact-item-actions">
                    {!contact.is_primary && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setPrimaryContact(index)}
                      >
                        Set as Primary
                      </button>
                    )}
                    {formData.contacts.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => removeContact(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="ba-form-grid">
                  <div className="ba-form-group">
                    <label className="ba-form-label">Name</label>
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) =>
                        handleContactChange(index, "name", e.target.value)
                      }
                      className="ba-form-input"
                      placeholder="Contact name"
                    />
                  </div>

                  <div className="ba-form-group">
                    <label className="ba-form-label">Designation</label>
                    <input
                      type="text"
                      value={contact.designation}
                      onChange={(e) =>
                        handleContactChange(index, "designation", e.target.value)
                      }
                      className="ba-form-input"
                      placeholder="e.g., CEO, Manager"
                    />
                  </div>

                  <div className="ba-form-group">
                    <label className="ba-form-label">Email</label>
                    <input
                      type="email"
                      value={contact.email}
                      onChange={(e) =>
                        handleContactChange(index, "email", e.target.value)
                      }
                      className={`ba-form-input ${errors[`contact_email_${index}`] ? "error" : ""}`}
                      placeholder="email@example.com"
                    />
                    {errors[`contact_email_${index}`] && (
                      <span className="ba-form-error">
                        {errors[`contact_email_${index}`]}
                      </span>
                    )}
                  </div>

                  <div className="ba-form-group">
                    <label className="ba-form-label">Phone</label>
                    <input
                      type="tel"
                      value={contact.phone}
                      onChange={(e) =>
                        handleContactChange(index, "phone", e.target.value)
                      }
                      className="ba-form-input"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contract Details */}
          <div className="ba-form-section">
            <h3 className="ba-form-section-title">Contract Details</h3>

            <div className="ba-form-grid">
              <div className="ba-form-group">
                <label className="ba-form-label">Contract Start Date</label>
                <input
                  type="date"
                  name="contract_start_date"
                  value={formData.contract_start_date}
                  onChange={handleChange}
                  className="ba-form-input"
                />
              </div>

              <div className="ba-form-group">
                <label className="ba-form-label">Contract End Date</label>
                <input
                  type="date"
                  name="contract_end_date"
                  value={formData.contract_end_date}
                  onChange={handleChange}
                  className={`ba-form-input ${errors.contract_end_date ? "error" : ""}`}
                />
                {errors.contract_end_date && (
                  <span className="ba-form-error">
                    {errors.contract_end_date}
                  </span>
                )}
              </div>

              <div className="ba-form-group ba-form-group-full">
                <label className="ba-form-label">Payment Terms</label>
                <input
                  type="text"
                  name="payment_terms"
                  value={formData.payment_terms}
                  onChange={handleChange}
                  className="ba-form-input"
                  placeholder="e.g., Net 30, 50% upfront"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="ba-form-section">
            <div className="ba-form-group">
              <label className="ba-form-label">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="ba-form-textarea"
                rows="4"
                placeholder="Any additional notes about this client..."
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="ba-modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner spinner-sm"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Create Client</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}