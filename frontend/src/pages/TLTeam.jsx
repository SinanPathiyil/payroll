import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/common/Layout";
import AddTeamMemberModal from "../components/tl/AddTeamMemberModal";
import {
  Users,
  Mail,
  CheckCircle,
  XCircle,
  Shield,
  FileText,
  Plus,
} from "lucide-react";
import axios from "axios";
import "../styles/tl-team.css";

export default function TLTeam() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/teams`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTeams(response.data || []);

      // Auto-select first team
      if (response.data && response.data.length > 0) {
        loadTeamMembers(response.data[0].id);
        setSelectedTeam(response.data[0]);
      }
    } catch (error) {
      console.error("Failed to load teams:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async (teamId) => {
    try {
      setLoadingMembers(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/teams/${teamId}/members`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTeamMembers(response.data || []);
    } catch (error) {
      console.error("Failed to load team members:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleTeamSelect = (team) => {
    setSelectedTeam(team);
    loadTeamMembers(team.id);
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Team...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="tl-team">
        {/* Header */}
        <div className="tl-team-header">
          <h1 className="tl-team-title">My Team</h1>
          <p className="tl-team-subtitle">View and manage your team members</p>
        </div>
        {teams.length === 0 ? (
          <div className="tl-team-members-card">
            <div className="tl-team-members-body">
              <div className="tl-team-empty">
                <Users className="tl-team-empty-icon" />
                <p className="tl-team-empty-text">No teams assigned to you</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Team Selector (if multiple teams) */}
            {teams.length > 1 && (
              <div className="tl-team-selector-card">
                <div className="tl-team-selector-header">
                  <div className="tl-team-selector-title">
                    <Shield className="w-5 h-5" />
                    <span>Select Team</span>
                  </div>
                </div>
                <div className="tl-team-selector-body">
                  <div className="tl-team-buttons">
                    {teams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => handleTeamSelect(team)}
                        className={`tl-team-button ${
                          selectedTeam?.id === team.id ? "active" : ""
                        }`}
                      >
                        <span>{team.team_name}</span>
                        <span className="tl-team-button-count">
                          {team.member_count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Team Overview Card - Combined Info */}
            {selectedTeam && (
              <>
                <div className="tl-team-overview-card">
                  <div className="tl-team-overview-header">
                    <div className="tl-team-overview-title">
                      <Shield className="w-5 h-5" />
                      <span>Team Overview</span>
                    </div>
                  </div>
                  <div className="tl-team-overview-body">
                    {/* Stats Grid */}
                    <div className="tl-team-stats-grid">
                      <div className="tl-team-stat-item">
                        <div className="tl-team-stat-icon tl-team-stat-icon-blue">
                          <Users className="w-6 h-6" />
                        </div>
                        <div className="tl-team-stat-details">
                          <p className="tl-team-stat-label">Team Name</p>
                          <p className="tl-team-stat-value">
                            {selectedTeam.team_name}
                          </p>
                        </div>
                      </div>

                      <div className="tl-team-stat-item">
                        <div className="tl-team-stat-icon tl-team-stat-icon-green">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <div className="tl-team-stat-details">
                          <p className="tl-team-stat-label">Total Members</p>
                          <p className="tl-team-stat-value">
                            {selectedTeam.member_count}
                          </p>
                        </div>
                      </div>

                      <div className="tl-team-stat-item">
                        <div className="tl-team-stat-icon tl-team-stat-icon-orange">
                          {selectedTeam.is_active ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : (
                            <XCircle className="w-6 h-6" />
                          )}
                        </div>
                        <div className="tl-team-stat-details">
                          <p className="tl-team-stat-label">Status</p>
                          <p className="tl-team-stat-value">
                            {selectedTeam.is_active ? "Active" : "Inactive"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Team Description - Inside Overview */}
                    {selectedTeam.description && (
                      <div className="tl-team-description-section">
                        <div className="tl-team-description-header-inline">
                          <FileText className="w-5 h-5" />
                          <span>Description</span>
                        </div>
                        <p className="tl-team-description-text">
                          {selectedTeam.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Team Members Table */}
                <div className="tl-team-members-card">
                  <div className="tl-team-members-header">
                    <div className="tl-team-members-title">
                      <Users className="w-5 h-5" />
                      <span>Team Members</span>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowAddMemberModal(true)}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Member</span>
                    </button>
                  </div>
                  <div className="tl-team-members-body">
                    {loadingMembers ? (
                      <div className="tl-team-loading">
                        <div className="tl-team-loading-spinner"></div>
                        <p className="tl-team-loading-text">
                          Loading members...
                        </p>
                      </div>
                    ) : teamMembers.length === 0 ? (
                      <div className="tl-team-empty">
                        <Users className="tl-team-empty-icon" />
                        <p className="tl-team-empty-text">
                          No team members yet
                        </p>
                      </div>
                    ) : (
                      <div className="tl-team-table-wrapper">
                        <table className="tl-team-table">
                          <thead>
                            <tr>
                              <th>Member</th>
                              <th>Email</th>
                              <th>Role</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teamMembers.map((member) => (
                              <tr key={member.id}>
                                <td>
                                  <div className="tl-team-member-cell">
                                    <div className="tl-team-member-avatar">
                                      {member.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="tl-team-member-info">
                                      <div className="tl-team-member-name">
                                        {member.full_name}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div className="tl-team-email-cell">
                                    <Mail className="w-4 h-4" />
                                    <span>{member.email}</span>
                                  </div>
                                </td>
                                <td>
                                  <span className="tl-team-role-badge">
                                    {member.role === "team_lead"
                                      ? "Team Lead"
                                      : "Employee"}
                                  </span>
                                </td>
                                <td>
                                  <span
                                    className={`tl-team-status-badge ${
                                      member.is_active ? "active" : "inactive"
                                    }`}
                                  >
                                    {member.is_active ? (
                                      <>
                                        <CheckCircle />
                                        Active
                                      </>
                                    ) : (
                                      <>
                                        <XCircle />
                                        Inactive
                                      </>
                                    )}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
        {/* Add Team Member Modal */}
        <AddTeamMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          onSuccess={() => {
            loadTeams();
            if (selectedTeam) {
              loadTeamMembers(selectedTeam.id);
            }
            setShowAddMemberModal(false);
          }}
          selectedTeam={selectedTeam}
        />
      </div>
    </Layout>
  );
}
