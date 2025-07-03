import Image from 'next/image'
import Link from 'next/link'
import Image1 from "./Image1.jpeg"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Clock, Bell, Video, ArrowRight } from 'lucide-react'

export default function Page() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10 -z-10" />
        
        <div className="max-w-6xl mx-auto text-center space-y-12 animate-fade-in">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Bridge Teacher Gaps
              <span className="block text-primary">Seamlessly</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Empowering Schools with On-Demand Access to Qualified Teachers
            </p>
          </div>
          
          <div className="relative max-w-4xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              <Image
                src={Image1}
                alt="Virtual classroom scenario"
                width={800}
                height={500}
                className="w-full h-auto object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Key Benefits</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover how Quad transforms education through seamless teacher-school connections
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                title: "Instant Teacher Access", 
                description: "Quickly request qualified substitute teachers when needed.",
                icon: Clock,
                color: "text-blue-500"
              },
              { 
                title: "Seamless Integration", 
                description: "Effortlessly match with experienced substitutes for uninterrupted education.",
                icon: CheckCircle,
                color: "text-green-500"
              },
              { 
                title: "Real-Time Updates", 
                description: "Stay updated with teacher availability and instant notifications.",
                icon: Bell,
                color: "text-amber-500"
              },
            ].map((benefit, index) => (
              <Card key={index} interactive className="group animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="p-8 text-center space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon className={`h-6 w-6 ${benefit.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-secondary/20">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to connect schools with qualified teachers
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { 
                step: "01",
                title: "Submit a Request", 
                description: "Using subject, topic, date, and time select the teacher" 
              },
              { 
                step: "02",
                title: "Get Matched", 
                description: "Connect with a qualified substitute teacher as they accept the request." 
              },
              { 
                step: "03",
                title: "Start Teaching", 
                description: "Automatic meeting link generated and recorded sessions saved." 
              },
            ].map((step, index) => (
              <div key={index} className="text-center space-y-6 animate-slide-up" style={{ animationDelay: `${index * 0.2}s` }}>
                <div className="relative">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-lg">
                    {step.step}
                  </div>
                  {index < 2 && (
                    <ArrowRight className="hidden md:block absolute top-1/2 -translate-y-1/2 left-full ml-6 h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="p-12">
              <blockquote className="text-2xl md:text-3xl font-semibold text-foreground leading-relaxed">
                "This app can revolutionize how we handle teacher absences. It's efficient, reliable, and students are going to love it!"
              </blockquote>
              <div className="mt-8">
                <p className="text-lg font-medium text-primary">— Quad Team</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-20 bg-secondary/20">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need for seamless teacher-school connections
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: CheckCircle, title: "Customizable for Local Needs", color: "text-green-500" },
              { icon: Bell, title: "Real-Time Notifications", color: "text-blue-500" },
              { icon: Video, title: "Automated Meeting Links", color: "text-purple-500" },
              { icon: Clock, title: "Session Recordings", color: "text-amber-500" },
            ].map((feature, index) => (
              <div key={index} className="text-center space-y-4 group animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="mx-auto w-16 h-16 rounded-2xl bg-card shadow-md flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-sm leading-relaxed">{feature.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call-to-Action */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join a network of schools and teachers revolutionizing education
            </p>
          </div>
          
          <Link href="/sign-up">
            <Button size="lg" className="text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group">
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-secondary/20">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Frequently Asked Questions</h2>
          </div>
          
          <div className="grid gap-6">
            {[
              {
                question: "How does the school request teacher",
                answer: "Schools can choose from the list of teachers and can filter through and then choose from them to send request to"
              },
              {
                question: "Is it free to sign up?",
                answer: "Yes, signing up is completely free."
              }
            ].map((faq, index) => (
              <Card key={index} interactive className="group">
                <CardContent className="p-8">
                  <h3 className="text-lg font-semibold mb-3 group-hover:text-primary transition-colors duration-300">
                    {faq.question}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Card className="bg-gradient-to-br from-card to-secondary/10">
            <CardContent className="p-8">
              <div className="space-y-3">
                <p className="text-lg">
                  <span className="font-semibold">Contact us:</span>{" "}
                  <a href="mailto:sher.singh.ug23@plaksha.edu.in" className="text-primary hover:underline">
                    sher.singh.ug23@plaksha.edu.in
                  </a>
                </p>
                <p className="text-muted-foreground">
                  Built with ❤️ by Quad Team
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

