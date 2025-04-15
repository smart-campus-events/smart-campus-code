import "bootstrap/dist/css/bootstrap.min.css";
import { Col, Row } from "react-bootstrap";
import { Backpack } from 'react-bootstrap-icons';
const Dashboard = () => {
  return (
    <div className="h-full text-base-content">
      <div id="dashboard" className="min-h-screen bg-lightcyan">
        <main style={{ paddingLeft: '170px', paddingRight: '20px', paddingTop: '20px', paddingBottom: '20px' }}>
          <div id="welcome-banner" className="mb-8">
            <h2 className="text-3xl font-bold mb-2" style={{ paddingTop: '2%' }}>Aloha, Sarah!</h2>
            <p className="text-gray-600">Here's what's happening around campus</p>
          </div>

          <section>
            <div className="flex justify-end items-center mb-4">
              <h4 className="text-2xl font-bold">Clubs You Might Like</h4>
              <a href="#" className="text-blue-500 text-align-right">See All →</a>
            </div>
            <Row className="g-30">
              {/* Club Card 1 */}
              <Col md={6} lg={4}>
                <div className="flex bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
                  <div className="w-1/2 relative overflow-hidden">
                    <img
                      src="https://storage.googleapis.com/uxpilot-auth.appspot.com/2f4070b305-a7b95a7dc469081b9a92.png"
                      alt="students gathering in a computer science club meeting, casual atmosphere"
                      style={{ width: '100%', height: '300px' }}
                    />
                    <div className="absolute top-2 right-2 bg-green-100 text-green-700 px-2 py-3 rounded-full text-xs">
                      Technology
                    </div>
                  </div>
                  <div className="w-1/2 p-2">
                    <h3 className="font-bold mb-1 text-sm">Computer Science Club</h3>
                    <p className="text-gray-600 text-xs mb-1">
                      Weekly meetups, coding challenges, and tech talks.
                    </p>
                    <div className="flex items-center text-xs" style={{ paddingTop: '5%' }}>
                      <a style={{ paddingRight: '1%' }}><Backpack /></a>
                      <span>156 members</span>
                    </div>
                  </div>
                </div>
              </Col>

              {/* Club Card 2 */}
              <Col md={6} lg={4}>
                <div className="flex bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
                  <div>
                    <img
                      src="https://storage.googleapis.com/uxpilot-auth.appspot.com/f7feb3e199-956b2045405a446d1a70.png"
                      alt="environmental club students planting trees, nature conservation"
                      style={{ width: '100%', height: '300px' }}
                    />
                    <div className="absolute top-2 right-2 bg-green-100 text-green-700 px-2 py-3 rounded-full text-xs">
                      Environment
                    </div>
                  </div>
                  <div className="w-1/2 p-2">
                    <h3 className="font-bold mb-1 text-sm">Sustainability Club</h3>
                    <p className="text-gray-600 text-xs mb-1">
                      Making UHM greener through community initiatives.
                    </p>
                    <div className="flex items-center text-xs" style={{ paddingTop: '5%' }}>
                      <a style={{ paddingRight: '1%' }}><Backpack /></a>
                      <span>89 members</span>
                    </div>
                  </div>
                </div>
              </Col>

              {/* Club Card 3 */}
              <Col md={6} lg={4}>
                <div className="flex bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
                  <div className="w-1/2 relative overflow-hidden">
                    <img
                      src="https://storage.googleapis.com/uxpilot-auth.appspot.com/1a823e2334-948c210f93d74a921b15.png"
                      alt="hawaiian cultural dance performance, traditional costumes"
                      style={{ width: '100%', height: '300px' }}
                    />
                    <div className="absolute top-2 right-2 bg-green-100 text-green-700 px-2 py-3 rounded-full text-xs">
                      Culture
                    </div>
                  </div>
                  <div className="w-1/2 p-2">
                    <h3 className="font-bold mb-1 text-sm">Hawaiian Culture Club</h3>
                    <p className="text-gray-600 text-xs mb-1">
                      Learn about Hawaiian traditions and practices.
                    </p>
                    <div className="flex items-center text-xs" style={{ paddingTop: '5%' }}>
                      <a style={{ paddingRight: '1%' }}><Backpack /></a>
                      <span>203 members</span>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </section>

          <section>
            <div className="flex justify-between items-center mt-8 mb-4">
              <h2 className="text-2xl font-bold py-3">Events Happening Soon</h2>
              <a href="#" className="text-blue-500 text-sm">View Calendar →</a>
            </div>
            <Row className="gap-10">
              {/* Event Card 1 */}
              <Col md={6}>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-lg" style={{ width: '300px' }}>
                  <div className="bg-red-500 text-gray px-4 py-2 text-center rounded-t-xl">
                    <h4 className="text-xl font-bold">MAR</h4>
                    <p className="text-sm">15</p>
                  </div>
                  <div className="p-4">
                    <h5 className="font-bold mb-2">Spring Career Fair 2025</h5>
                    <p className="text-gray-600 text-sm mb-2">9:00 AM - 3:00 PM</p>
                    <p className="text-gray-600 text-sm">Campus Center Ballroom</p>
                  </div>
                </div>
              </Col>

              {/* Event Card 2 */}
              <Col md={6}>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-lg" style={{ width: '300px' }}>
                  <div className="bg-green-500 text-gray px-4 py-2 text-center rounded-t-xl">
                    <h4 className="text-xl font-bold">MAR</h4>
                    <p className="text-sm">18</p>
                  </div>
                  <div className="p-4">
                    <h5 className="font-bold mb-2">Lei Making Workshop</h5>
                    <p className="text-gray-600 text-sm mb-2">2:00 PM - 4:00 PM</p>
                    <p className="text-gray-600 text-sm">Queen Lili'uokalani Center</p>
                  </div>
                </div>
              </Col>
            </Row>
          </section>

          <section className="mt-8 py-3">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-align-right mb-4">
                <h2 className="text-2xl font-bold">Connect with Peers</h2>
              </div>
              <Row>
                <Col md={8}>
                  <p className="text-gray-600 text-sm">Find students with similar interests</p>
                </Col>
                <Col md={4} className="text-right">
                  <a href="#" className="text-blue-500 text-sm">Find Connections</a>
                </Col>
              </Row>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Important Announcements</h2>
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <div className="flex items-start gap-4">
                {/* Placeholder for an icon, you might need to install a library like @heroicons/react */}
                <div> {/* */} </div>
                <div>
                  <h4 className="font-bold">Spring Break Schedule Changes</h4>
                  <p className="text-gray-600 text-sm">Modified campus services hours during March 25-29, 2025</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                {/* Placeholder for an icon */}
                <div> {/* */} </div>
                <div>
                  <h4 className="font-bold">Library Extended Hours</h4>
                  <p className="text-gray-600 text-sm">24/7 access available during finals week</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
