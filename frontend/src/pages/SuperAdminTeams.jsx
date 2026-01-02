import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/common/Layout';
import axios from 'axios';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  UserCheck,
  AlertCircle,
  X,
  Briefcase,
  CheckCircle,
  XCircle
} from 'lucide-react';
import '../styles/super-admin-teams.css';

export default function SuperAdminTeams() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [createForm, setCreateForm] = useState({
    team_name: '',
    description: '',
    team_lead_id: ''
  });

  const [editForm, setEditForm] = useState({
    team_name: '',
    description: '',
    team_lead_id: '',
    is_active: true
  });

  useEffect(() => {
    fetchTeams();
    fetchTeamLeads();
  }, []);

  useEffect(() => {
    filterTeams();
  }, [teams, searchTerm, statusFilter]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/teams`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTeams(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamLeads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/super-admin/team-leads`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTeamLeads(response.data);
    } catch (err) {
      console.error('Error fetching team leads:', err);
    }
  };

  const filterTeams = () => {
    let filtered = [...teams];

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.team_lead_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== '') {
      filtered = filtered.filter(t => t.is_active === (statusFilter === 'true'));
    }

    setFilteredTeams(filtered);
  };

  // CREATE TEAM
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    
    if (!createForm.team_lead_id) {
      alert('Please select a team lead');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/teams`,
        createForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowCreateModal(false);
      setCreateForm({
        team_name: '',
        description: '',
        team_lead_id: ''
      });
      fetchTeams();
      alert('Team created successfully!');
    } catch (err) {
      console.error('Error creating team:', err);
      alert(err.response?.data?.detail || 'Failed to create team');
    } finally {
      setSubmitting(false);
    }
  };

  // EDIT TEAM
  const handleEdit = (team) => {
    setSelectedTeam(team);
    setEditForm({
      team_name: team.team_name,
      description: team.description || '',
      team_lead_id: team.team_lead_id,
      is_active: team.is_active
    });
    setShowEditModal(true);
  };

  const handleUpdateTeam = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/teams/${selectedTeam.id}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowEditModal(false);
      fetchTeams();
      alert('Team updated successfully!');
    } catch (err) {
      console.error('Error updating team:', err);
      alert(err.response?.data?.detail || 'Failed to update team');
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE TEAM
  const handleDelete = (team) => {
    setSelectedTeam(team);
    setShowDeleteModal(true);
  };

  const handleDeleteTeam = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/teams/${selectedTeam.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowDeleteModal(false);
      fetchTeams();
      alert('Team deactivated successfully!');
    } catch (err) {
      console.error('Error deleting team:', err);
      alert(err.response?.data?.detail || 'Failed to delete team');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="sat-loading">
          <div className="sat-loading-spinner"></div>
          <p>Loading Teams...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="sat-container">
        {/* Header */}
        <div className="sat-header">
          <div>
            <h1 className="sat-title">Team Management</h1>
            <p className="sat-subtitle">
              Manage teams and team assignments
            </p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Create Team</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="sat-stats">
          <div className="sat-stat-item">
            <div className="sat-stat-label">Total Teams</div>
            <div className="sat-stat-value">{teams.length}</div>
          </div>
          <div className="sat-stat-item">
            <div className="sat-stat-label">Active Teams</div>
            <div className="sat-stat-value sat-stat-success">
              {teams.filter(t => t.is_active).length}
            </div>
          </div>
          <div className="sat-stat-item">
            <div className="sat-stat-label">Total Members</div>
            <div className="sat-stat-value">
              {teams.reduce((acc, t) => acc + t.member_count, 0)}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="sat-filters">
          <div className="sat-search">
            <Search className="sat-search-icon" />
            <input
              type="text"
              placeholder="Search by team name or lead..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sat-search-input"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="sat-filter-select"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* Teams Table */}
        <div className="sat-card">
          <div className="sat-table-wrapper">
            <table className="sat-table">
              <thead>
                <tr>
                  <th>Team Name</th>
                  <th>Team Lead</th>
                  <th>Members</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeams.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="sat-empty">
                      <Briefcase className="sat-empty-icon" />
                      <p>No teams found</p>
                    </td>
                  </tr>
                ) : (
                  filteredTeams.map((team) => (
                    <tr key={team.id}>
                      <td>
                        <div className="sat-team-cell">
                          <div className="sat-team-avatar">
                            {team.team_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="sat-team-name">{team.team_name}</div>
                            {team.description && (
                              <div className="sat-team-desc">{team.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="sat-lead-info">
                          <UserCheck className="w-4 h-4" />
                          <span>{team.team_lead_name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="sat-member-count">
                          {team.member_count} {team.member_count === 1 ? 'member' : 'members'}
                        </span>
                      </td>
                      <td>
                        <span className={`sat-status ${team.is_active ? 'sat-status-active' : 'sat-status-inactive'}`}>
                          {team.is_active ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              <span>Inactive</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td>
                        <div className="sat-actions">
                          <button
                            className="sat-action-btn"
                            onClick={() => handleEdit(team)}
                            title="Edit Team"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            className="sat-action-btn sat-action-danger"
                            onClick={() => handleDelete(team)}
                            title="Deactivate Team"
                            disabled={!team.is_active}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CREATE TEAM MODAL */}
        {showCreateModal && (
          <div className="sat-modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="sat-modal" onClick={(e) => e.stopPropagation()}>
              <div className="sat-modal-header">
                <h2>Create New Team</h2>
                <button onClick={() => setShowCreateModal(false)} className="sat-modal-close">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateTeam}>
                <div className="sat-modal-body">
                  <div className="sat-form-group">
                    <label>Team Name *</label>
                    <input
                      type="text"
                      value={createForm.team_name}
                      onChange={(e) => setCreateForm({...createForm, team_name: e.target.value})}
                      className="sat-input"
                      placeholder="Engineering Team"
                      required
                    />
                  </div>

                  <div className="sat-form-group">
                    <label>Description (Optional)</label>
                    <textarea
                      value={createForm.description}
                      onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                      className="sat-textarea"
                      placeholder="Brief description of the team..."
                      rows="3"
                    />
                  </div>

                  <div className="sat-form-group">
                    <label>Team Lead *</label>
                    <select
                      value={createForm.team_lead_id}
                      onChange={(e) => setCreateForm({...createForm, team_lead_id: e.target.value})}
                      className="sat-input"
                      required
                    >
                      <option value="">-- Select Team Lead --</option>
                      {teamLeads.map(tl => (
                        <option key={tl.id} value={tl.id}>
                          {tl.full_name} ({tl.email})
                        </option>
                      ))}
                    </select>
                    {teamLeads.length === 0 && (
                      <small className="sat-help-text">
                        No team leads available. Please create a team lead user first.
                      </small>
                    )}
                  </div>
                </div>

                <div className="sat-modal-footer">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="sat-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting || teamLeads.length === 0} className="sat-btn-primary">
                    {submitting ? 'Creating...' : 'Create Team'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT TEAM MODAL */}
        {showEditModal && (
          <div className="sat-modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="sat-modal" onClick={(e) => e.stopPropagation()}>
              <div className="sat-modal-header">
                <h2>Edit Team</h2>
                <button onClick={() => setShowEditModal(false)} className="sat-modal-close">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleUpdateTeam}>
                <div className="sat-modal-body">
                  <div className="sat-form-group">
                    <label>Team Name *</label>
                    <input
                      type="text"
                      value={editForm.team_name}
                      onChange={(e) => setEditForm({...editForm, team_name: e.target.value})}
                      className="sat-input"
                      required
                    />
                  </div>

                  <div className="sat-form-group">
                    <label>Description (Optional)</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      className="sat-textarea"
                      rows="3"
                    />
                  </div>

                  <div className="sat-form-group">
                    <label>Team Lead *</label>
                    <select
                      value={editForm.team_lead_id}
                      onChange={(e) => setEditForm({...editForm, team_lead_id: e.target.value})}
                      className="sat-input"
                      required
                    >
                      <option value="">-- Select Team Lead --</option>
                      {teamLeads.map(tl => (
                        <option key={tl.id} value={tl.id}>
                          {tl.full_name} ({tl.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sat-form-group">
                    <label>Status *</label>
                    <select
                      value={editForm.is_active}
                      onChange={(e) => setEditForm({...editForm, is_active: e.target.value === 'true'})}
                      className="sat-input"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="sat-modal-footer">
                  <button type="button" onClick={() => setShowEditModal(false)} className="sat-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="sat-btn-primary">
                    {submitting ? 'Updating...' : 'Update Team'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE TEAM MODAL */}
        {showDeleteModal && (
          <div className="sat-modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="sat-modal" onClick={(e) => e.stopPropagation()}>
              <div className="sat-modal-header">
                <h2>Deactivate Team</h2>
                <button onClick={() => setShowDeleteModal(false)} className="sat-modal-close">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="sat-modal-body">
                <div className="sat-modal-warning">
                  <AlertCircle className="w-6 h-6" />
                  <p>This will deactivate the team and remove all member assignments!</p>
                </div>
                <div className="sat-modal-info">
                  <div><strong>Team:</strong> {selectedTeam?.team_name}</div>
                  <div><strong>Team Lead:</strong> {selectedTeam?.team_lead_name}</div>
                  <div><strong>Members:</strong> {selectedTeam?.member_count}</div>
                </div>
                <p className="sat-modal-text">
                  Are you sure you want to deactivate this team?
                </p>
              </div>
              <div className="sat-modal-footer">
                <button onClick={() => setShowDeleteModal(false)} className="sat-btn-secondary">
                  Cancel
                </button>
                <button onClick={handleDeleteTeam} disabled={submitting} className="sat-btn-danger">
                  {submitting ? 'Deactivating...' : 'Deactivate Team'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}