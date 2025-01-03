import Image from 'next/image'
import Link from 'next/link'
import Image1 from "./Image1.jpeg"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Clock, Bell, Video } from 'lucide-react'

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Bridge Teacher Gaps Seamlessly
        </h1>
        <p className="mt-3 text-xl sm:mt-5 sm:text-2xl max-w-2xl mx-auto">
          Empowering Schools with On-Demand Access to Qualified Teachers
        </p>
        <div className="mt-8 flex justify-center">
          <Image
            src={Image1}
            alt="Virtual classroom scenario"
            width={600}
            height={400}
            className="rounded-lg shadow-lg"
          />
        </div>
      </section>

      {/* Value Propositions */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Key Benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: "Instant Teacher Access", description: "Quickly request qualified substitute teachers when needed." },
            { title: "Seamless Integration", description: "Effortlessly match with experienced substitutes for uninterrupted education." },
            { title: "Real-Time Updates", description: "Stay updated with teacher availability." },
  
          ].map((prop, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">{prop.title}</h3>
                <p className="text-gray-600">{prop.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "Submit a Request", description: "Using subject, topic, date, and time select the teacher" },
            { title: "Get Matched", description: "Connect with a qualified substitute teacher as they accept the request." },
            { title: "Start Teaching", description: "Automatic meeting link generated and recorded sessions saved." },
          ].map((step, index) => (
            <div key={index} className="text-center">
              <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                {index + 1}
              </div>
              <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
              <p className="">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section className="mb-16 text-center">
        <blockquote className="text-2xl font-semibold italic ">
          "This app can revolutionize how we handle teacher absences. It's efficient, reliable, and students are going to love it!"
        </blockquote>
        <p className="mt-4">- Quad Team</p>
        
      </section>

      {/* Features Overview */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Features</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: CheckCircle, title: "Customizable for Local Needs" },
            { icon: Bell, title: "Real-Time Notifications" },
            { icon: Video, title: "Automated Meeting Links" },
            { icon: Clock, title: "Session Recordings" },
          ].map((feature, index) => (
            <div key={index} className="text-center">
              <feature.icon className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold">{feature.title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Call-to-Action */}
      <section className="text-center mb-16">
        <Link href="/sign-up">
        <Button size="lg" className="text-lg px-8 py-3">
          Get Started Today
        </Button>
        </Link>
        <p className="mt-4 ">
          Join a network of schools and teachers revolutionizing education.
        </p>
      </section>

      {/* FAQ */}
      <section className="mb-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">How does the school request teacher</h3>
            <p >Schools can choose from the list fo teachers and can filter through and then choose from them to send request to</p>
          </div>
          <div>
            <h3 className="font-semibold">Is it free to sign up?</h3>
            <p >Yes, signing up is completely free. </p>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <div className="text-center ">
        <p>Contact us: sher.singh.ug23@plaksha.edu.in</p>
        <p className="mt-2">Powered by Quad Team</p>
      </div>
    </div>
  )
}

