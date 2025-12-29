import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/common/Layout";
import {
  Users,
  Mail,
  CheckCircle,
  XCircle,
  User,
  Shield,
} from "lucide-react";
import axios from "axios";

export default function TLTeam() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

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
      <div className="ba-dashboard">
        {/* Header */}
        <div className="ba-dashboard-header">
          <div>
            <h1 className="ba-dashboard-title">My Team</h1>
            <p className="ba-dashboard-subtitle">
              View and manage your team members
            </p>
          </div>
        </div>

        {teams.length === 0 ? (
          <div className="ba-card">
            <div className="ba-card-body">
              <div className="ba-empty-state">
                <Users className="ba-empty-icon" />
                <p>No teams assigned to you</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Team Selector (if multiple teams) */}
            {teams.length > 1 && (
              <div className="ba-card" style={{ marginBottom: "2rem" }}>
                <div className="ba-card-header">
                  <div className="ba-card-title">
                    <Shield className="w-5 h-5" />
                    <span>Select Team</span>
                  </div>
                </div>
                <div className="ba-card-body">
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    {teams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => handleTeamSelect(team)}
                        className={`btn ${selectedTeam?.id === team.id ? "btn-primary" : "btn-secondary"}`}
                      >
                        {team.team_name} ({team.member_count} members)
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Team Stats */}
            {selectedTeam && (
              <>
                <div
                  className="ba-stats-grid"
                  style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
                >
                  <div className="ba-stat-card">
                    <div className="ba-stat-content">
                      <div className="ba-stat-info">
                        <p className="ba-stat-label">Team Name</p>
                        <p className="ba-stat-value" style={{ fontSize: "1.5rem" }}>
                          {selectedTeam.team_name}
                        </p>
                      </div>
                      <div className="ba-stat-icon ba-stat-icon-blue">
                        <Users className="w-8 h-8" />
                      </div>
                    </div>
                  </div>

                  <div className="ba-stat-card">
                    <div className="ba-stat-content">
                      <div className="ba-stat-info">
                        <p className="ba-stat-label">Total Members</p>
                        <p className="ba-stat-value">{selectedTeam.member_count}</p>
                      </div>
                      <div className="ba-stat-icon ba-stat-icon-green">
                        <CheckCircle className="w-8 h-8" />
                      </div>
                    </div>
                  </div>

                  <div className="ba-stat-card">
                    <div className="ba-stat-content">
                      <div className="ba-stat-info">
                        <p className="ba-stat-label">Status</p>
                        <p className="ba-stat-value" style={{ fontSize: "1.5rem" }}>
                          {selectedTeam.is_active ? "Active" : "Inactive"}
                        </p>
                      </div>
                      <div className="ba-stat-icon ba-stat-icon-orange">
                        {selectedTeam.is_active ? (
                          <CheckCircle className="w-8 h-8" />
                        ) : (
                          <XCircle className="w-8 h-8" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Members Table */}
                <div className="ba-card">
                  <div className="ba-card-header">
                    <div className="ba-card-title">
                      <Users className="w-5 h-5" />
                      <span>Team Members</span>
                    </div>
                  </div>
                  <div className="ba-card-body">
                    {loadingMembers ? (
                      <div style={{ textAlign: "center", padding: "2rem" }}>
                        <div className="spinner spinner-lg" style={{ margin: "0 auto" }}></div>
                        <p style={{ marginTop: "1rem", color: "#6b7280" }}>Loading members...</p>
                      </div>
                    ) : teamMembers.length === 0 ? (
                      <div className="ba-empty-state">
                        <Users className="ba-empty-icon" />
                        <p>No team members yet</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table">
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
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <div
                                      style={{
                                        width: "40px",
                                        height: "40px",
                                        borderRadius: "50%",
                                        background: "linear-gradient(135deg, rgba(11, 11, 13, 0.08), rgba(11, 11, 13, 0.12))",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: "700",
                                        fontSize: "1rem",
                                        color: "rgba(11, 11, 13, 0.7)",
                                      }}
                                    >
                                      {member.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: "600" }}>{member.full_name}</div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <Mail className="w-4 h-4" style={{ color: "#6b7280" }} />
                                    <span>{member.email}</span>
                                  </div>
                                </td>
                                <td>
                                  <span className="ba-stat-badge info">
                                    {member.role === "team_lead" ? "Team Lead" : "Employee"}
                                  </span>
                                </td>
                                <td>
                                  <span
                                    className={`ba-stat-badge ${member.is_active ? "success" : ""}`}
                                  >
                                    {member.is_active ? (
                                      <>
                                        <CheckCircle className="w-4 h-4" />
                                        Active
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="w-4 h-4" />
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

                {/* Team Description */}
                {selectedTeam.description && (
                  <div className="ba-card">
                    <div className="ba-card-header">
                      <div className="ba-card-title">
                        <User className="w-5 h-5" />
                        <span>Team Description</span>
                      </div>
                    </div>
                    <div className="ba-card-body">
                      <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
                        {selectedTeam.description}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}