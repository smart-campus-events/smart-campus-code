import { faBell, faPenToSquare, faRightFromBracket, faStar } from '@fortawesome/free-regular-svg-icons';
import { faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Col, Container, Row } from 'react-bootstrap';

const ProfilePage = () => {
  return (
    <div className="h-full text-base-content bg-gradient-to-b from-blue-50 to-white">
      {/* Header/Navigation */}
      <header id="header" className="bg-white shadow-sm">
        <Container fluid className="px-4 py-4">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center space-x-8">
              <img
                className="h-10"
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/d8899fadb3-5df15300b4c172c2ef67.png"
                alt="Manoa Compass Logo"
              />
              <nav className="d-none d-md-flex space-x-6">
                <span className="text-gray-600 hover:text-green-600 cursor-pointer">Dashboard</span>
                <span className="text-gray-600 hover:text-green-600 cursor-pointer">Events</span>
                <span className="text-gray-600 hover:text-green-600 cursor-pointer">RIOs</span>
                <span className="text-gray-600 hover:text-green-600 cursor-pointer">Connections</span>
              </nav>
            </div>
            <div className="d-flex align-items-center space-x-4">
              <Button variant="ghost" className="text-gray-600 hover:text-green-600">
                <FontAwesomeIcon icon={faBell} className="text-xl" />
              </Button>
              <div className="position-relative">
                <img
                  src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg"
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-green-500"
                />
              </div>
            </div>
          </div>
        </Container>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div id="profile-header" className="d-flex align-items-center justify-content-between mb-8">
            <div className="d-flex align-items-center space-x-4">
              <img
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg"
                alt="Profile"
                className="w-20 h-20 rounded-full border-4 border-green-500"
              />
              <div>
                <h1 className="text-2xl font-bold">Sarah Connor&apos;s Profile</h1>
                <p className="text-gray-600">Member since January 2025</p>
              </div>
            </div>
            <div className="d-flex space-x-4">
              <Button variant="outline-secondary" className="px-4 py-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                <FontAwesomeIcon icon={faPenToSquare} className="mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline-danger" className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                <FontAwesomeIcon icon={faRightFromBracket} className="mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Profile Content */}
          <Row className="g-6">
            {/* Left Column */}
            <Col md={12} lg={8} className="space-y-6">
              {/* Basic Information */}
              <div id="basic-info" className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">Basic Information</h2>
                <div className="space-y-4">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <p className="text-gray-600">Email</p>
                      <p className="font-medium">sarah.connor@hawaii.edu</p>
                    </div>
                    <Button variant="link" className="text-blue-600 text-sm">
                      Change Password
                    </Button>
                  </div>
                  <div>
                    <p className="text-gray-600">Major</p>
                    <p className="font-medium">Computer Science</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Interests</p>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Programming</span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Hiking</span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Photography</span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Surfing</span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Gaming</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div id="additional-info" className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">Additional Details</h2>
                <Row className="g-4">
                  <Col>
                    <p className="text-gray-600">Age Range</p>
                    <p className="font-medium">19-21</p>
                  </Col>
                  <Col>
                    <p className="text-gray-600">Origin</p>
                    <p className="font-medium">US Mainland</p>
                  </Col>
                  <Col>
                    <p className="text-gray-600">Housing Status</p>
                    <p className="font-medium">On-Campus Dorm</p>
                  </Col>
                  <Col>
                    <p className="text-gray-600">Comfort Level</p>
                    <div className="d-flex align-items-center space-x-1">
                      <FontAwesomeIcon icon={faStarSolid} className="text-yellow-400" />
                      <FontAwesomeIcon icon={faStarSolid} className="text-yellow-400" />
                      <FontAwesomeIcon icon={faStarSolid} className="text-yellow-400" />
                      <FontAwesomeIcon icon={faStarSolid} className="text-yellow-400" />
                      <FontAwesomeIcon icon={faStar} className="text-yellow-400" />
                    </div>
                  </Col>
                </Row>
                <div className="mt-4">
                  <p className="text-gray-600">About Me</p>
                  <p className="mt-2">
                    Enthusiastic Computer Science student looking to connect with fellow tech enthusiasts and explore the
                    beautiful island of Oahu. Always up for a coding challenge or a hiking adventure!
                  </p>
                </div>
              </div>
            </Col>

            {/* Right Column */}
            <Col md={12} lg={4} className="space-y-6">
              {/* Saved Events */}
              <div id="saved-events" className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">Saved Events</h2>
                <div className="space-y-4">
                  <div className="d-flex items-center space-x-3">
                    <div className="bg-blue-100 text-blue-800 rounded-lg p-2 w-12 text-center">
                      <div className="text-xs">MAR</div>
                      <div className="font-bold">15</div>
                    </div>
                    <div>
                      <p className="font-medium">Tech Meetup</p>
                      <p className="text-sm text-gray-600">6:00 PM - Campus Center</p>
                    </div>
                  </div>
                  <div className="d-flex items-center space-x-3">
                    <div className="bg-blue-100 text-blue-800 rounded-lg p-2 w-12 text-center">
                      <div className="text-xs">MAR</div>
                      <div className="font-bold">20</div>
                    </div>
                    <div>
                      <p className="font-medium">Beach Cleanup</p>
                      <p className="text-sm text-gray-600">9:00 AM - Ala Moana</p>
                    </div>
                  </div>
                </div>
                <Button variant="link" className="w-full mt-4 text-center text-blue-600 text-sm">
                  View All Events
                </Button>
              </div>

              {/* My RIOs */}
              <div id="my-rios" className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">My RIOs</h2>
                <div className="space-y-3">
                  <div className="d-flex items-center space-x-3">
                    <img
                      src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg"
                      alt="RIO"
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium">ACM Manoa</p>
                      <p className="text-sm text-gray-600">Computer Science Club</p>
                    </div>
                  </div>
                  <div className="d-flex items-center space-x-3">
                    <img
                      src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg"
                      alt="RIO"
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium">Hiking Club</p>
                      <p className="text-sm text-gray-600">Outdoor Activities</p>
                    </div>
                  </div>
                </div>
                <Button variant="link" className="w-full mt-4 text-center text-blue-600 text-sm">
                  View All RIOs
                </Button>
              </div>

              {/* Settings */}
              <div id="settings" className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">Settings</h2>
                <div className="space-y-4">
                  <div className="d-flex items-center justify-content-between">
                    <span>Email Notifications</span>
                    <div className="relative inline-block w-12 h-6 rounded-full bg-green-500">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="d-flex items-center justify-content-between">
                    <span>Push Notifications</span>
                    <div className="relative inline-block w-12 h-6 rounded-full bg-gray-300">
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
