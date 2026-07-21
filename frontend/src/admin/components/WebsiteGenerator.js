import React, { useState } from 'react';
import './WebsiteGenerator.css';

const WebsiteGenerator = () => {
  const [formData, setFormData] = useState({
    company: '',
    services: '',
    about: '',
    footerInfo: '',
    theme: 'Modern',
  });

  const [generatedSites, setGeneratedSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('form');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleGenerateSingle = async () => {
    if (!formData.company || !formData.services || !formData.about) {
      setError('❌ Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/website/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminAccessToken')}`,
        },
        body: JSON.stringify({
          company: formData.company,
          services: formData.services,
          about: formData.about,
          footerInfo: formData.footerInfo,
          theme: formData.theme,
          userId: localStorage.getItem('adminId'),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedSites([data.website]);
        setActiveTab('preview');
        setError('');
      } else {
        setError(`❌ Error: ${data.message}`);
      }
    } catch (err) {
      setError(`❌ Error connecting to server: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMultiple = async () => {
    if (!formData.company || !formData.services || !formData.about) {
      setError('❌ Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/website/generate-multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminAccessToken')}`,
        },
        body: JSON.stringify({
          company: formData.company,
          services: formData.services,
          about: formData.about,
          footerInfo: formData.footerInfo,
          userId: localStorage.getItem('adminId'),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedSites(data.websites);
        setActiveTab('preview');
        setError('');
      } else {
        setError(`❌ Error: ${data.message}`);
      }
    } catch (err) {
      setError(`❌ Error connecting to server: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (website) => {
    const element = document.createElement('a');
    const file = new Blob([website.html], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `${formData.company}-${website.theme}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSaveWebsite = async (website) => {
    try {
      const response = await fetch('/api/website/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminAccessToken')}`,
        },
        body: JSON.stringify({
          userId: localStorage.getItem('adminId'),
          userName: localStorage.getItem('adminName'),
          theme: website.theme,
          company: formData.company,
          html: website.html,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setError('✅ Website saved successfully!');
        setTimeout(() => setError(''), 3000);
      } else {
        setError(`❌ Error: ${data.message}`);
      }
    } catch (err) {
      setError(`❌ Error saving website: ${err.message}`);
    }
  };

  return (
    <div className="website-generator">
      <div className="generator-header">
        <h2>🚀 Website Generator</h2>
        <p>Create professional websites with multiple design themes</p>
      </div>

      <div className="generator-tabs">
        <button
          className={`tab-button ${activeTab === 'form' ? 'active' : ''}`}
          onClick={() => setActiveTab('form')}
        >
          📝 Generate
        </button>
        <button
          className={`tab-button ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          👁️ Preview ({generatedSites.length})
        </button>
      </div>

      {activeTab === 'form' && (
        <div className="generator-form">
          <div className="form-group">
            <label>Company Name *</label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              placeholder="Enter your company name"
              required
            />
          </div>

          <div className="form-group">
            <label>Services (one per line) *</label>
            <textarea
              name="services"
              value={formData.services}
              onChange={handleInputChange}
              placeholder="Service 1&#10;Service 2&#10;Service 3"
              rows={5}
              required
            />
          </div>

          <div className="form-group">
            <label>About *</label>
            <textarea
              name="about"
              value={formData.about}
              onChange={handleInputChange}
              placeholder="Write a compelling about section"
              rows={4}
              required
            />
          </div>

          <div className="form-group">
            <label>Footer Info (optional)</label>
            <textarea
              name="footerInfo"
              value={formData.footerInfo}
              onChange={handleInputChange}
              placeholder="Additional footer information"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Theme</label>
            <select name="theme" value={formData.theme} onChange={handleInputChange}>
              <option value="Modern">Modern</option>
              <option value="Dark">Dark</option>
              <option value="Minimal">Minimal</option>
              <option value="Card">Card</option>
              <option value="Hero">Hero</option>
            </select>
          </div>

          {error && <div className={`alert ${error.includes('✅') ? 'success' : 'error'}`}>{error}</div>}

          <div className="form-actions">
            <button
              className="btn btn-primary"
              onClick={handleGenerateSingle}
              disabled={loading}
            >
              {loading ? '⏳ Generating...' : `✨ Generate ${formData.theme}`}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleGenerateMultiple}
              disabled={loading}
            >
              {loading ? '⏳ Generating...' : '🎨 Generate All Themes'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="generator-preview">
          {generatedSites.length === 0 ? (
            <div className="empty-state">
              <p>No websites generated yet. Go to the Generate tab to create one!</p>
            </div>
          ) : (
            <div className="preview-grid">
              {generatedSites.map((website) => (
                <div key={website.id} className="preview-card">
                  <div className="preview-header">
                    <h3>{website.theme} Theme</h3>
                    <p>{formData.company}</p>
                  </div>

                  <div className="preview-actions">
                    <button
                      className="action-btn view"
                      onClick={() => {
                        const newWindow = window.open();
                        newWindow.document.write(website.html);
                      }}
                      title="View in new window"
                    >
                      👁️ View
                    </button>
                    <button
                      className="action-btn download"
                      onClick={() => handleDownload(website)}
                      title="Download HTML"
                    >
                      ⬇️ Download
                    </button>
                    <button
                      className="action-btn save"
                      onClick={() => handleSaveWebsite(website)}
                      title="Save to database"
                    >
                      💾 Save
                    </button>
                  </div>

                  <div className="preview-snippet">
                    <iframe
                      srcDoc={website.html}
                      title={`${website.theme} Preview`}
                      className="preview-iframe"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WebsiteGenerator;
